/**
 * 根据职位标题 + 岗位描述，将投递归类到固定类别（用于统计与展示）
 * 顺序：先匹配更具体的类别，再匹配泛化「软件开发」
 */

export const JOB_CATEGORY_KEYS = [
  'fullstack',
  'frontend',
  'backend',
  'software_dev',
  'qa',
  'devops',
  'data',
  'other',
]

/**
 * @param {{ position?: string, jobDescription?: string }} app
 * @returns {string} JOB_CATEGORY_KEYS 之一
 */
export function classifyJobCategory(app) {
  const position = (app?.position || '').trim()
  const jd = (app?.jobDescription || '').trim()
  const text = `${position}\n${jd}`.toLowerCase()

  // 全栈 / Full-stack
  if (
    /full[\s-]?stack|fullstack|全栈|全端|全栈工程师|全栈开发/.test(text)
  ) {
    return 'fullstack'
  }

  // 测试 / QA
  if (
    /\bqa\b|q\/a|quality assurance|test (automation )?engineer|sdet|测试工程师|软件测试|测试开发|自动化测试|质量保证/.test(
      text
    )
  ) {
    return 'qa'
  }

  // DevOps / SRE / 运维（偏基础设施）
  if (
    /\bdevops\b|\bsre\b|site reliability|kubernetes|\bk8s\b|docker|jenkins|terraform|ansible|ci\/cd|云平台运维|运维工程师|基础设施/.test(
      text
    )
  ) {
    return 'devops'
  }

  // 数据 / 算法 / BI
  if (
    /data (analyst|scientist|engineer)|business intelligence|\bbi\b engineer|数据分析|数据工程师|数据科学家|机器学习|深度学习|算法工程师|ml engineer|ai engineer/.test(
      text
    )
  ) {
    return 'data'
  }

  // 前端
  if (
    /front[-\s]?end|react( native)?|vue(\.js)?|angular|svelte|next\.js|nuxt|前端|前端开发|前端工程师|web developer|ui developer/.test(
      text
    )
  ) {
    return 'frontend'
  }

  // 后端
  if (
    /back[-\s]?end|server[-\s]?side|spring|django|flask|fastapi|express|nest\.js|\.net|java (developer|engineer)|golang|go (developer|engineer)|rust (developer|engineer)|后端|后端开发|后端工程师/.test(
      text
    )
  ) {
    return 'backend'
  }

  // 泛化软件开发（未命中上述细分时）
  if (
    /software (developer|engineer)|developer|programmer|开发工程师|软件工程师|工程师|研发工程师|application developer|web developer|mobile developer|ios|android|kotlin|swift/.test(
      text
    )
  ) {
    return 'software_dev'
  }

  return 'other'
}

/**
 * @param {Array<{ position?: string, jobDescription?: string }>} applications
 * @returns {Array<{ category: string, count: number }>}
 */
export function getCategoryCounts(applications) {
  const counts = {}
  JOB_CATEGORY_KEYS.forEach((k) => {
    counts[k] = 0
  })
  ;(applications || []).forEach((app) => {
    const cat = classifyJobCategory(app)
    counts[cat] = (counts[cat] || 0) + 1
  })
  return JOB_CATEGORY_KEYS.filter((k) => counts[k] > 0)
    .map((category) => ({ category, count: counts[category] }))
    .sort((a, b) => b.count - a.count)
}
