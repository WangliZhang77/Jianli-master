// 简历优化提示词模板存储工具
const STORAGE_KEY = 'resumeOptimizationPrompts'

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
