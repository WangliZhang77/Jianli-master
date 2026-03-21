/**
 * 基于服务端 AI 字段的统计（投递记录图表）
 */

export function getAiCategoryCounts(apps) {
  const counts = {}
  for (const app of apps || []) {
    const key = app.jobCategoryAi || 'unclassified'
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getSeniorityCounts(apps) {
  const order = ['junior', 'intermediate', 'senior', 'unclassified']
  const counts = { junior: 0, intermediate: 0, senior: 0, unclassified: 0 }
  for (const app of apps || []) {
    const s = app.jobSeniorityAi
    if (s && counts[s] !== undefined) counts[s] += 1
    else counts.unclassified += 1
  }
  return order
    .filter((k) => counts[k] > 0)
    .map((seniority) => ({ seniority, count: counts[seniority] }))
}
