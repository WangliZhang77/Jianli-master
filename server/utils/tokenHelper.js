/**
 * 用于控制 API 输入长度，降低 token 消耗
 * 中文约 1.5 字/token，英文约 4 字/token，按字符截断可粗略控制上限
 */

const DEFAULT_MAX_RESUME_CHARS = 4000
const DEFAULT_MAX_JD_CHARS = 2000
const DEFAULT_MAX_RESUME_FOR_COVER_LETTER_CHARS = 3000

function truncate(str, maxChars, suffix = '…') {
  if (typeof str !== 'string') return str
  const s = str.trim()
  if (s.length <= maxChars) return s
  return s.slice(0, maxChars) + suffix
}

export function truncateResume(text) {
  const max = Number(process.env.MAX_RESUME_CHARS) || DEFAULT_MAX_RESUME_CHARS
  return truncate(text, max)
}

export function truncateJobDescription(text) {
  const max = Number(process.env.MAX_JD_CHARS) || DEFAULT_MAX_JD_CHARS
  return truncate(text, max)
}

/** 推荐信阶段只传简历前 N 字，节省输入 token */
export function truncateResumeForCoverLetter(text) {
  const max = Number(process.env.MAX_RESUME_FOR_COVER_LETTER_CHARS) || DEFAULT_MAX_RESUME_FOR_COVER_LETTER_CHARS
  return truncate(text, max)
}

/** 主模型：简历优化、推荐信。默认 gpt-4o */
export function getMainModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o'
}

/** 轻量任务用便宜模型：职位信息提取 */
export function getLightModel() {
  return process.env.OPENAI_LIGHT_MODEL || 'gpt-4o-mini'
}
