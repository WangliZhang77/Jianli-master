/**
 * 投递行为统计（与 AI 画像共用数据结构；可纯前端计算）
 */

function toDayKey(isoOrDate) {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

/** 含今天在內的最近 N 天 [start, end] */
function windowLastNDays(n) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - (n - 1))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function countInWindow(apps, start, end) {
  let c = 0
  for (const app of apps || []) {
    const d = new Date(app.date)
    if (!Number.isNaN(d.getTime()) && d >= start && d <= end) c += 1
  }
  return c
}

/**
 * @param {Array<{ date: string, jobCategoryAi?: string, jobSeniorityAi?: string }>} apps
 */
export function computeApplicationInsightStats(apps) {
  const list = Array.isArray(apps) ? apps : []
  const total = list.length

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

  const dayMap = {}
  for (const app of list) {
    const k = toDayKey(app.date)
    if (!k) continue
    dayMap[k] = (dayMap[k] || 0) + 1
  }

  const days = Object.keys(dayMap).sort()
  const firstDate = days[0] || null
  const lastDate = days[days.length - 1] || null
  const activeDays = days.length
  const avgPerActiveDay = activeDays > 0 ? total / activeDays : 0

  const w7 = windowLastNDays(7)
  const w30 = windowLastNDays(30)
  const countLast7 = countInWindow(list, w7.start, w7.end)
  const countLast30 = countInWindow(list, w30.start, w30.end)
  const avgPerDayLast7 = countLast7 / 7
  const avgPerDayLast30 = countLast30 / 30

  let peakDay = null
  for (const [date, count] of Object.entries(dayMap)) {
    if (!peakDay || count > peakDay.count) peakDay = { date, count }
  }

  const dailyLast14 = []
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  for (let i = 13; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyLast14.push({ date: key, count: dayMap[key] || 0 })
  }

  const categoryCounts = {}
  const seniorityCounts = {}
  for (const app of list) {
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
