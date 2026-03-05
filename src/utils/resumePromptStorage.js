// 简历优化提示词模板存储工具
const STORAGE_KEY = 'resumeOptimizationPrompts'

/** 内置的默认简历优化提示词（用于恢复默认） */
export function getDefaultPrompts() {
  return [
    {
      id: 'default',
      name: '默认模板',
      prompt: `你是一位专业的简历优化专家。请根据以下岗位描述，优化以下简历，使其更符合岗位要求。

岗位描述：
{jobDescription}

原始简历：
{resume}

请按照以下要求优化简历：
1. 保持简历的真实性，不要编造经历
2. 突出与岗位要求相关的技能和经验
3. 使用更专业、更有说服力的表达方式
4. 调整内容顺序，将最相关的经历放在前面
5. 保持简历的格式和结构清晰
6. 确保优化后的简历仍然准确反映候选人的真实能力

**重要格式要求**：
- 每段工作经验必须使用bullet point（项目符号，即"-"或"•"）来展示
- 每段工作经验至少要有5-6个bullet point
- 每个bullet point描述一个具体的职责、成就或项目
- 使用高权重动词（如"主导"、"设计"、"实现"、"优化"、"推动"等）
- 尽量量化成果（如性能提升、业务增长、团队规模等）

输出格式示例：
公司名称 | 职位名称 | 时间范围
• 第一个bullet point描述（具体职责或成就）
• 第二个bullet point描述（具体职责或成就）
• 第三个bullet point描述（具体职责或成就）
• 第四个bullet point描述（具体职责或成就）
• 第五个bullet point描述（具体职责或成就）
• 第六个bullet point描述（具体职责或成就）

请直接返回优化后的简历内容，使用bullet point格式，不要添加额外的说明文字。`,
      systemPrompt: '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。你非常注重使用bullet point格式来展示工作经历，每段工作经验都会用5-6个bullet point来详细描述。'
    },
    {
      id: 'hiring-manager',
      name: '角色匹配优化模板（Hiring Manager 风格）',
      prompt: `You are acting as a senior Hiring Manager and technical interviewer with 10+ years of experience hiring across software engineering, quality assurance, data, systems, and IT support roles. I am applying for the following role: {jobDescription} Here is my original resume content: {resume} ──────────────────────────────────── YOUR OBJECTIVE ──────────────────────────────────── Optimize this resume to maximize my chances of being shortlisted for the above role, focusing on real-world role fit rather than generic technical claims. Your output should reflect how a strong junior-to-mid-level candidate for THIS SPECIFIC ROLE would realistically present their experience. ──────────────────────────────────── STEP 1 — ROLE LOCK (CRITICAL) ──────────────────────────────────── Before rewriting anything, infer the PRIMARY role category from the JD: (e.g. Software Engineer, Test Analyst / QA, Data Analyst, DevOps, IT Support, Systems Analyst). All rewritten content MUST be framed from the perspective of this role. Do NOT default to a software developer narrative unless the JD clearly demands it. ──────────────────────────────────── STEP 2 — RESPONSIBILITY & DELIVERABLE MAPPING ──────────────────────────────────── Extract the key day-to-day responsibilities and deliverables from the JD, such as: - core tasks - outputs the role is responsible for - tools used to produce those outputs - collaboration expectations Every section of the resume MUST map back to these responsibilities, not just list technologies. ──────────────────────────────────── STEP 3 — EXPERIENCE TRANSLATION (NO FAKE EXPERTISE) ──────────────────────────────────── Where direct experience is missing, translate relevant adjacent work into role-relevant responsibilities. Examples: - Development → testing, validation, debugging, documentation - Data work → analysis, reporting, quality checks - Support work → incident handling, root-cause analysis, communication - Cloud exposure → environment setup, monitoring, deployment support Do NOT invent senior-level ownership or unrealistic scope. Use "working knowledge", "hands-on exposure", or "supported" where needed. ──────────────────────────────────── STEP 3.5 — TECH STACK GAP HANDLING (CRITICAL) ──────────────────────────────────── If a technology, tool, or platform appears in the JD but is not explicitly mentioned in the original resume, you MAY include it in the optimized resume ONLY if it can be reasonably justified by: - Hands-on exposure during project or internship work - Supporting, configuring, validating, or testing systems using that technology - Using it in a limited scope (labs, side projects, internal tools) - Learning and applying it in a practical, non-expert capacity When doing so, you MUST: - Clearly indicate the level as "working knowledge", "hands-on exposure", or "familiarity" - Avoid claiming ownership, design authority, or deep expertise - Place such technologies appropriately in the Skills section or within experience bullets as supporting tools DO NOT fabricate senior-level or end-to-end ownership experience. Credibility always takes priority over keyword coverage. ──────────────────────────────────── STEP 4 — PROFESSIONAL SUMMARY (MANDATORY) ──────────────────────────────────── Rewrite the Professional Summary to: - Clearly match the inferred role category - Be 3–4 concise sentences - State who I am, what I do, and what problems I help solve - Avoid vague traits (e.g. passionate, highly motivated) The Summary must make it obvious which role I am applying for within the first 10 seconds of reading. ──────────────────────────────────── STEP 5 — WORK & PROJECT EXPERIENCE OUTPUT RULES ──────────────────────────────────── For EACH role or project: - Provide at least 5–6 bullet points - Use strong action verbs - Implicitly follow STAR (focus on Action + Result) - At least 50% of bullets should reflect the role's core responsibilities - Quantify outcomes where reasonable (conservative estimates allowed) ──────────────────────────────────── STEP 6 — SKILLS SECTION (SINGLE-LINE, DOMAIN-BASED) ──────────────────────────────────── Rewrite the Skills section using a domain-based structure with ONE LINE per skill category. You MUST: - Use clear functional domains as category headers (e.g. FRONTEND, BACKEND & DATABASE, CLOUD & DEVOPS, TESTING, ENGINEERING PRACTICES) - Present each category in the following exact format: CATEGORY NAME: skill1, skill2, skill3, skill4 - Place all relevant skills on the SAME LINE after the colon - Separate skills using commas only - Maintain consistent technical granularity within each category Skill depth MAY be indicated inline using subtle qualifiers such as: (hands-on experience), (working knowledge), (foundational), (familiarity). Do NOT: Use bullet points or sub-lists; Use headings like "Languages & Frameworks"; Split skills across multiple lines within the same category; Use Markdown or special formatting symbols. The final Skills section must be scannable within 5 seconds by both ATS systems and hiring managers. ──────────────────────────────────── STEP 7 — OUTPUT CONSTRAINTS ──────────────────────────────────── - Output ONLY the optimized English CV content - No explanations, no meta text - Use bullet points for experience and projects - Keep tone professional, credible, and hiring-manager friendly ──────────────────────────────────── GOAL ──────────────────────────────────── Produce a resume that: - Passes ATS screening - Reads naturally to HR and hiring managers - Demonstrates realistic ability to perform this role within 3–6 months - Aligns with New Zealand / Australian hiring expectations FORMAT REQUIREMENTS (CRITICAL): - Do NOT use Markdown formatting - Do NOT use **, *, or any special symbols for emphasis - Use plain text only - Section headings should be in ALL CAPS without symbols - Use hyphens (-) for bullet points`,
      systemPrompt: 'You are a senior Hiring Manager and technical interviewer with 10+ years of experience. You optimize resumes for real-world role fit and ATS, with strict rules against fabricating expertise. Output only the optimized English CV; no meta text.'
    }
  ]
}

export function getPrompts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('读取提示词失败:', error)
  }
  return getDefaultPrompts()
}

/** 恢复为内置的默认简历优化模板（会覆盖当前保存的列表） */
export function resetToDefaultPrompts() {
  const defaults = getDefaultPrompts()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  return defaults
}

export function savePrompt(prompt) {
  try {
    const prompts = getPrompts()
    const existingIndex = prompts.findIndex(p => p.id === prompt.id)
    
    if (existingIndex >= 0) {
      prompts[existingIndex] = prompt
    } else {
      // 生成新 ID
      prompt.id = Date.now().toString()
      prompts.push(prompt)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
    return prompt
  } catch (error) {
    console.error('保存提示词失败:', error)
    throw error
  }
}

export function deletePrompt(id) {
  try {
    const prompts = getPrompts()
    const filtered = prompts.filter(p => p.id !== id)
    
    // 不能删除默认模板
    if (id === 'default') {
      throw new Error('不能删除默认模板')
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除提示词失败:', error)
    throw error
  }
}

export function getPromptById(id) {
  const prompts = getPrompts()
  return prompts.find(p => p.id === id)
}
