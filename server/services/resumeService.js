import OpenAI from 'openai'
import { getMainModel, truncateResume, truncateJobDescription } from '../utils/tokenHelper.js'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API 密钥未配置，请在 .env 文件中设置 OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey })
}

/** 一次调用：提取公司/职位 + 优化简历，返回 { companyName, position, optimizedResume }，省一次 JD 发送 */
export async function extractAndOptimizeResume(resume, jobDescription, customPrompt, systemPrompt) {
  const openai = getOpenAIClient()
  const jd = truncateJobDescription(jobDescription)
  const resumeText = truncateResume(resume)
  const systemMsg = systemPrompt || '简历优化与信息提取专家。只返回 JSON：companyName、position、optimizedResume。'

  let userContent
  if (customPrompt && customPrompt.trim().length > 0) {
    userContent = customPrompt + '\n\n请同时从岗位描述中提取公司名、职位名；并按要求输出优化后的简历。只返回 JSON：{"companyName":"","position":"","optimizedResume":""}，找不到用 ""。'
  } else {
    userContent = `【任务1】从岗位描述提取公司名、职位名。【任务2】按以下要求优化简历。只输出 JSON：{"companyName":"","position":"","optimizedResume":""}，找不到公司/职位用 ""。

岗位描述：
${jd}

原始简历：
${resumeText}

优化要求：根据岗位描述优化简历，保持真实、突出相关经历与技能、篇幅与原文相当或更详实，不要缩短。`
  }

  const completion = await openai.chat.completions.create({
    model: getMainModel(),
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content.trim()
  let data
  try {
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
    data = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error('解析提取+优化结果失败: ' + raw.slice(0, 150))
  }
  return {
    companyName: String(data.companyName ?? '').trim(),
    position: String(data.position ?? '').trim(),
    optimizedResume: String(data.optimizedResume ?? '').trim(),
  }
}

export async function optimizeResume(resume, jobDescription, customPrompt, systemPrompt) {
  const openai = getOpenAIClient()
  const jd = truncateJobDescription(jobDescription)
  const resumeText = truncateResume(resume)
  try {
    let prompt
    let systemMessage

    if (customPrompt) {
      prompt = customPrompt
      systemMessage = systemPrompt || '简历优化专家，按岗位要求优化。'
    } else {
      systemMessage = '简历优化专家。篇幅与原文相当或更详实，不缩短不省略。只返回简历正文。'
      prompt = `按岗位描述优化简历：真实、突出相关经历与技能，篇幅相当或更长。

岗位描述：
${jd}

原始简历：
${resumeText}`
    }

    const completion = await openai.chat.completions.create({
      model: getMainModel(),
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    })

    return completion.choices[0].message.content.trim()
  } catch (error) {
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API 密钥未配置或无效，请在 .env 文件中设置 OPENAI_API_KEY')
    }
    throw new Error('优化简历失败: ' + error.message)
  }
}
