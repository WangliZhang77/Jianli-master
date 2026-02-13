// 提示词模板存储工具
const STORAGE_KEY = 'coverLetterPrompts'

export function getPrompts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('读取提示词失败:', error)
  }
  
  // 返回默认提示词
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
    }
  ]
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
