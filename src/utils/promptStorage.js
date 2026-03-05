// 提示词模板存储工具
const STORAGE_KEY = 'coverLetterPrompts'

/** 内置的默认推荐信提示词（用于恢复默认） */
export function getDefaultPrompts() {
  return [
    {
      id: 'default',
      name: '默认模板（英文）',
      prompt: `You are a professional cover letter writing expert. Please generate a professional and persuasive cover letter based on the following optimized resume and job description.

Job Description:
{jobDescription}

Optimized Resume:
{resume}

Please follow these requirements to generate the cover letter:
1. Start with a polite greeting (e.g., "Dear Hiring Manager" or "Dear [Company Name] Team")
2. Briefly introduce yourself and state the position you are applying for
3. Highlight the skills and experiences from your resume that best match the job requirements
4. Express your interest in the company and the position
5. End with a polite closing and express your hope for a response
6. Use professional, sincere, and persuasive language
7. Keep it concise, approximately 300-500 words
8. Write entirely in English - do not use any Chinese characters

Please return only the cover letter content without any additional explanations or notes.`,
      systemPrompt: 'You are a professional cover letter writing expert, skilled at writing persuasive cover letters based on resumes and job requirements. Always write in English.'
    },
    {
      id: 'chinese',
      name: '中文模板',
      prompt: `你是一位专业的求职信撰写专家。请根据以下优化后的简历和岗位描述，生成一封专业、有说服力的推荐信（求职信）。

岗位描述：
{jobDescription}

优化后的简历：
{resume}

请按照以下要求生成推荐信：
1. 开头要有礼貌的称呼（可以使用"尊敬的招聘经理"）
2. 简要介绍自己并说明申请的岗位
3. 突出简历中与岗位要求最匹配的技能和经验
4. 表达对公司和岗位的兴趣
5. 结尾要有礼貌的结束语和期待回复
6. 语言要专业、真诚、有说服力
7. 长度适中，大约300-500字
8. 使用中文撰写

请直接返回推荐信内容，不要添加额外的说明文字。`,
      systemPrompt: '你是一位专业的求职信撰写专家，擅长根据简历和岗位要求撰写有说服力的推荐信。'
    },
    {
      id: 'nz-style',
      name: '新西兰风格推荐信（NZ Hiring Manager）',
      prompt: `You are a senior HR manager and technical hiring lead with 10+ years of experience hiring software and IT professionals in New Zealand, with deep familiarity with NZ hiring culture and expectations.

I am applying for the following role:

Job Description:
{jobDescription}

Company Information (JD / website / brief research, if available):
{companyInfo}

My Resume:
{resume}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write a tailored, professional New Zealand–style cover letter that:
- Survives initial HR screening (30–60 second scan)
- Clearly demonstrates role fit and relevance
- Sounds natural, concise, and credible to a local NZ hiring manager
- Encourages the reader to proceed to interview review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE & LENGTH (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Length: 250–350 words maximum
- Format: One page only
- Structure: 4 clear paragraphs
- Each paragraph: 2–4 sentences

Required paragraph flow:
1. Application intent & role alignment
2. Most relevant technical or project experience
3. Collaboration / communication / customer-facing experience
4. Polite close with interview request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT RULES (NZ-SPECIFIC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Mandatory Tailoring (Critical)
- The cover letter MUST be tailored to the specific role and company.
- The opening paragraph must clearly state: the role being applied for (matching the JD title), why my background is relevant to THIS role.
- Mention the company, product, team, or domain at least once.
- Avoid generic or reusable template language.

2. Relevance Over Repetition
- DO NOT repeat my resume or list my full work history.
- Select only 2 key strengths or experiences that best match the JD.
- Explicitly connect each example to a responsibility or requirement in the JD.

3. Evidence Over Adjectives
- Avoid vague traits such as "hard-working", "passionate", "fast learner".
- Instead, use concise STAR-style evidence: what I did (action), why it mattered (problem), what changed (result or outcome).
- Use realistic, defensible outcomes where possible (ranges acceptable).

4. Communication & Collaboration (Highly Valued in NZ)
- Include at least one example demonstrating direct collaboration with stakeholders, customers, or business users; how feedback or discussion influenced technical or product decisions.
- Emphasize clarity, initiative, and the ability to work without heavy supervision.

5. Professional, Direct NZ Tone
- Tone should be professional, clear, confident but not sales-heavy.
- Avoid overly promotional or exaggerated language.
- Write in plain, straightforward English.

6. Proper Addressing
- Address the letter to a named Hiring Manager if known.
- If not known, use "Dear Hiring Manager".
- NEVER use "To whom it may concern".

7. Closing & Call to Action
- End with a polite, professional close: express appreciation for consideration, clearly state interest in discussing the role further.
- Example intent (do not copy verbatim): "I would welcome the opportunity to discuss how my experience could contribute to your team."

8. Exclusions (Important)
- Do NOT mention: salary expectations (unless explicitly requested), visa details (unless explicitly required), unrelated personal information.
- Do NOT include emojis, bullet points, or headings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Output ONLY the finalized cover letter text
- No explanations, no analysis, no meta commentary
- Use standard business letter formatting
- Language: professional, concise, New Zealand–appropriate English

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL SUCCESS CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The cover letter should:
- Read naturally to a New Zealand HR manager
- Clearly demonstrate role fit within the first paragraph
- Use concrete examples instead of generic claims
- Be easy to scan, easy to understand, and easy to say "yes" to`,
      systemPrompt: 'You are a senior HR manager and technical hiring lead with 10+ years of experience in New Zealand hiring. You write tailored, professional NZ-style cover letters. Output only the cover letter text; no meta commentary.'
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

/** 恢复为内置的默认推荐信模板（会覆盖当前保存的列表） */
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
