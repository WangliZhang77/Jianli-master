import OpenAI from 'openai'
import { getLightModel } from '../utils/tokenHelper.js'

function getOpenAIClient(apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) throw new Error('请在前端设置 OpenAI API Key 或配置 OPENAI_API_KEY')
  return new OpenAI({ apiKey: key })
}

/**
 * 与前端 computeApplicationInsightStats 对齐的聚合（服务端用 DB 行）
 */
export function buildInsightStatsFromRows(rows) {
  const apps = (rows || []).map((r) => ({
    date: r.date,
    jobCategoryAi: r.job_category_ai ?? r.jobCategoryAi ?? null,
    jobSeniorityAi: r.job_seniority_ai ?? r.jobSeniorityAi ?? null,
  }))

  const total = apps.length
  if (total === 0) {
    return {
      total: 0,
      firstDate: null,
      lastDate: null,
      activeDays: 0,
      avgPerActiveDay: 0,
      avgPerDayLast7: 0,
      avgPerDayLast30: 0,
      countLast7: 0,
      countLast30: 0,
      peakDay: null,
      dailyLast14: [],
      categoryCounts: {},
      seniorityCounts: {},
    }
  }

  const toDayKey = (iso) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }

  const dayMap = {}
  for (const app of apps) {
    const k = toDayKey(app.date)
    if (!k) continue
    dayMap[k] = (dayMap[k] || 0) + 1
  }

  const days = Object.keys(dayMap).sort()
  const firstDate = days[0] || null
  const lastDate = days[days.length - 1] || null
  const activeDays = days.length
  const avgPerActiveDay = activeDays > 0 ? total / activeDays : 0

  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start7 = new Date(end)
  start7.setDate(start7.getDate() - 6)
  start7.setHours(0, 0, 0, 0)
  const start30 = new Date(end)
  start30.setDate(start30.getDate() - 29)
  start30.setHours(0, 0, 0, 0)

  let countLast7 = 0
  let countLast30 = 0
  for (const app of apps) {
    const d = new Date(app.date)
    if (Number.isNaN(d.getTime())) continue
    if (d >= start7 && d <= end) countLast7 += 1
    if (d >= start30 && d <= end) countLast30 += 1
  }

  const avgPerDayLast7 = countLast7 / 7
  const avgPerDayLast30 = countLast30 / 30

  let peakDay = null
  for (const [date, count] of Object.entries(dayMap)) {
    if (!peakDay || count > peakDay.count) peakDay = { date, count }
  }

  const dailyLast14 = []
  const dayEnd = new Date()
  dayEnd.setHours(0, 0, 0, 0)
  for (let i = 13; i >= 0; i--) {
    const d = new Date(dayEnd)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyLast14.push({ date: key, count: dayMap[key] || 0 })
  }

  const categoryCounts = {}
  const seniorityCounts = {}
  for (const app of apps) {
    const c = app.jobCategoryAi || 'unclassified'
    categoryCounts[c] = (categoryCounts[c] || 0) + 1
    const s = app.jobSeniorityAi || 'unclassified'
    seniorityCounts[s] = (seniorityCounts[s] || 0) + 1
  }

  return {
    total,
    firstDate,
    lastDate,
    activeDays,
    avgPerActiveDay,
    avgPerDayLast7,
    avgPerDayLast30,
    countLast7,
    countLast30,
    peakDay,
    dailyLast14,
    categoryCounts,
    seniorityCounts,
  }
}

export function fingerprintForInsight(rows) {
  if (!rows.length) return '0'
  const maxId = Math.max(...rows.map((r) => r.id))
  let maxCls = 0
  for (const r of rows) {
    const raw = r.classification_at ?? r.classificationAt
    const t = raw ? new Date(raw).getTime() : 0
    if (!Number.isNaN(t) && t > maxCls) maxCls = t
  }
  return `${rows.length}|${maxId}|${maxCls}`
}

/**
 * @param {object} stats — buildInsightStatsFromRows 结果
 * @param {string} locale — 'zh' | 'en'
 */
export async function generateDeliveryPersonaInsight(stats, apiKey, locale = 'zh') {
  const openai = getOpenAIClient(apiKey)
  const isZh = locale !== 'en'

  const pct = (n, t) => (t > 0 ? ((n / t) * 100).toFixed(1) : '0')

  const catEntries = Object.entries(stats.categoryCounts || {}).sort((a, b) => b[1] - a[1])
  const senEntries = Object.entries(stats.seniorityCounts || {}).sort((a, b) => b[1] - a[1])

  const payload = {
    stats: {
      total: stats.total,
      firstDate: stats.firstDate,
      lastDate: stats.lastDate,
      activeDays: stats.activeDays,
      avgPerActiveDay: Number(stats.avgPerActiveDay.toFixed(2)),
      avgPerDayLast7: Number(stats.avgPerDayLast7.toFixed(2)),
      avgPerDayLast30: Number(stats.avgPerDayLast30.toFixed(2)),
      countLast7: stats.countLast7,
      countLast30: stats.countLast30,
      peakDay: stats.peakDay,
      dailyLast14: stats.dailyLast14,
    },
    categories: catEntries.map(([key, count]) => ({
      key,
      count,
      pct: pct(count, stats.total),
    })),
    seniority: senEntries.map(([key, count]) => ({
      key,
      count,
      pct: pct(count, stats.total),
    })),
  }

  const system = isZh
    ? `你是求职数据分析助手。用户投递记录中的岗位类别、职级已由系统预先标注（枚举值如 fullstack_dev、junior 等）。请根据给定的 JSON 统计撰写「投递行为分析」与「投递画像」。
要求：
- 用中文输出，语气专业、友好、可执行。
- 包含：① 日均投递强度（活跃日平均、最近7天/30天日均）；② 岗位类型取向；③ 职级取向；④ 3～5 句用户画像式总结。
- 不要编造统计里没有的数字；未分类占比高时请提醒先完成 AI 岗位分类。
- 使用 Markdown：可用 ## 小标题、**加粗**、列表；总长度控制在 400 字以内。`
    : `You are a career coach analyst. Job categories and seniority levels in the payload are pre-tagged (e.g. fullstack_dev, junior). Write a concise "application pattern" analysis and a short user persona in English.
Include: daily intensity (active-day average, last 7/30-day averages), role-type tendency, seniority tendency, and a 3–5 sentence persona summary.
Do not invent numbers. If "unclassified" dominates, suggest running AI classification first.
Use Markdown with ## headings, **bold**, lists; keep under 350 words.`

  const user = `Analyze this JSON:\n${JSON.stringify(payload)}`

  const completion = await openai.chat.completions.create({
    model: getLightModel(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_completion_tokens: 2000,
  })

  const text = completion.choices?.[0]?.message?.content?.trim() || ''
  if (!text) throw new Error('AI 未返回分析内容')
  return text
}
