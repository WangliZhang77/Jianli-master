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

export async function generateCoverLetter(resume, jobDescription, customPrompt, systemPrompt) {
  const openai = getOpenAIClient()
  try {
    // 使用自定义提示词或默认提示词
    let prompt
    let systemMessage

    if (customPrompt) {
      // 替换占位符
      prompt = customPrompt
        .replace(/{jobDescription}/g, jobDescription)
        .replace(/{resume}/g, resume)
      systemMessage = systemPrompt || '你是一位专业的求职信撰写专家，擅长根据简历和岗位要求撰写有说服力的推荐信。'
    } else {
      // 使用默认提示词（英文）
      prompt = `You are a professional cover letter writing expert. Please generate a professional and persuasive cover letter based on the following optimized resume and job description.

Job Description:
${jobDescription}

Optimized Resume:
${resume}

Please follow these requirements to generate the cover letter:
1. Start with a polite greeting (e.g., "Dear Hiring Manager" or "Dear [Company Name] Team")
2. Briefly introduce yourself and state the position you are applying for
3. Highlight the skills and experiences from your resume that best match the job requirements
4. Express your interest in the company and the position
5. End with a polite closing and express your hope for a response
6. Use professional, sincere, and persuasive language
7. Keep it concise, approximately 300-500 words
8. Write entirely in English - do not use any Chinese characters

Please return only the cover letter content without any additional explanations or notes.`
      systemMessage = 'You are a professional cover letter writing expert, skilled at writing persuasive cover letters based on resumes and job requirements. Always write in English.'
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
      temperature: 0.8,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content.trim()
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API 密钥未配置或无效，请在 .env 文件中设置 OPENAI_API_KEY')
    }
    throw new Error('生成推荐信失败: ' + error.message)
  }
}
