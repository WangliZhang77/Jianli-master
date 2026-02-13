import OpenAI from 'openai'

// 延迟初始化 OpenAI 客户端
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API 密钥未配置，请在 .env 文件中设置 OPENAI_API_KEY')
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

export async function optimizeResume(resume, jobDescription, customPrompt, systemPrompt) {
  const openai = getOpenAIClient()
  try {
    // 使用自定义提示词或默认提示词
    let prompt
    let systemMessage

    if (customPrompt) {
      // 提示词已经在前端处理过占位符，直接使用
      prompt = customPrompt
      systemMessage = systemPrompt || '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
    } else {
      // 使用默认提示词
      prompt = `你是一位专业的简历优化专家。请根据以下岗位描述，优化以下简历，使其更符合岗位要求。

岗位描述：
${jobDescription}

原始简历：
${resume}

请按照以下要求优化简历：
1. 保持简历的真实性，不要编造经历
2. 突出与岗位要求相关的技能和经验
3. 使用更专业、更有说服力的表达方式
4. 调整内容顺序，将最相关的经历放在前面
5. 保持简历的格式和结构清晰
6. 确保优化后的简历仍然准确反映候选人的真实能力

请直接返回优化后的简历内容，不要添加额外的说明文字。`
      systemMessage = '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return completion.choices[0].message.content.trim()
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API 密钥未配置或无效，请在 .env 文件中设置 OPENAI_API_KEY')
    }
    throw new Error('优化简历失败: ' + error.message)
  }
}
