import OpenAI from 'openai'
import { getMainModel } from '../utils/tokenHelper.js'

function getOpenAIClient(apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('请在前端设置 OpenAI API Key 或配置服务端 OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey: key })
}

const CATEGORY_ENUM = [
  'fullstack_dev',
  'software_dev',
  'frontend',
  'backend',
  'qa_testing',
  'devops_infra',
  'data_analytics',
  'it_support',
  'other',
]

const SENIORITY_ENUM = ['junior', 'intermediate', 'senior']

function truncate(str, max = 1800) {
  if (typeof str !== 'string') return ''
  const s = str.trim()
  if (s.length <= max) return s
  return s.slice(0, max) + '…'
}

/**
 * 一批投递记录 AI 分类（岗位类型 + 职级）
 * @param {Array<{ id: number, position: string, jobDescription: string }>} items
 * @param {string} apiKey
 * @returns {Promise<Array<{ id: number, category: string, seniority: string }>>}
 */
export async function classifyApplicationsBatch(items, apiKey) {
  if (!items.length) return []
  const openai = getOpenAIClient(apiKey)

  const payload = items.map((a) => ({
    id: a.id,
    position: (a.position || '').slice(0, 200),
    jobDescription: truncate(a.jobDescription || '', 2000),
  }))

  const system = `You classify job applications for analytics. Output ONLY valid JSON, no markdown.

For each item you MUST return:
- category: exactly one of: ${CATEGORY_ENUM.join(', ')}
  - fullstack_dev: full-stack / 全栈 development
  - software_dev: general software developer/engineer when not more specific
  - frontend: front-end, React, Vue, UI-focused dev
  - backend: back-end, API, server-side
  - qa_testing: QA, test engineer, SDET, 测试
  - devops_infra: DevOps, SRE, cloud ops, CI/CD, 运维
  - data_analytics: data analyst/scientist/engineer, BI, 数据分析
  - it_support: IT support, helpdesk, desktop support, 技术支持 (not pure dev)
  - other: product, PM, design, or unclear

- seniority: exactly one of: ${SENIORITY_ENUM.join(', ')}
  - junior: entry, graduate, intern, 0-2 years, "初级", Associate/Junior in title
  - intermediate: mid-level, 2-5 years, 中级, no senior/lead in title
  - senior: senior, lead, principal, staff, 高级/资深, 5+ years implied, architect (unless junior architect)

Return JSON object: { "results": [ { "id": number, "category": string, "seniority": string }, ... ] }
Include every input id exactly once.`

  const user = `Classify these job applications:\n${JSON.stringify(payload)}`

  const completion = await openai.chat.completions.create({
    model: getMainModel(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    max_completion_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content.trim()
  let data
  try {
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
    data = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error('解析 AI 分类结果失败: ' + raw.slice(0, 200))
  }

  const results = data.results
  if (!Array.isArray(results)) {
    throw new Error('AI 返回格式错误: 缺少 results 数组')
  }

  const normalized = []
  const seen = new Set()
  for (const r of results) {
    const id = Number(r.id)
    if (!Number.isFinite(id) || seen.has(id)) continue
    seen.add(id)
    let category = String(r.category || 'other').toLowerCase()
    if (!CATEGORY_ENUM.includes(category)) category = 'other'
    let seniority = String(r.seniority || 'intermediate').toLowerCase()
    if (!SENIORITY_ENUM.includes(seniority)) seniority = 'intermediate'
    normalized.push({ id, category, seniority })
  }

  return normalized
}

export { CATEGORY_ENUM, SENIORITY_ENUM }
