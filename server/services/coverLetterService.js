import OpenAI from 'openai'
import { getMainModel, truncateJobDescription, truncateResumeForCoverLetter } from '../utils/tokenHelper.js'

function getOpenAIClient(apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('请在前端设置 OpenAI API Key 或配置服务端 OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey: key })
}

export async function generateCoverLetter(resume, jobDescription, customPrompt, systemPrompt, apiKey) {
  const openai = getOpenAIClient(apiKey)
  const jd = truncateJobDescription(jobDescription)
  const resumeText = truncateResumeForCoverLetter(resume)
  try {
    let prompt
    let systemMessage

    if (customPrompt) {
      prompt = customPrompt
        .replace(/{jobDescription}/g, jd)
        .replace(/{resume}/g, resumeText)
      systemMessage = systemPrompt || '求职信专家，按简历与岗位写推荐信。'
    } else {
      systemMessage = 'Cover letter writer. Output only the letter, 300-500 words, English.'
      prompt = `Write cover letter (English): greeting, intro+position, match skills, closing.

Job:
${jd}

Resume:
${resumeText}`
    }

    const completion = await openai.chat.completions.create({
      model: getMainModel(),
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content.trim()
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API 密钥未配置或无效，请在前端重新设置 API Key')
    }
    throw new Error('生成推荐信失败: ' + error.message)
  }
}
