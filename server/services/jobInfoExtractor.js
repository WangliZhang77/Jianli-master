import OpenAI from 'openai'
import { getLightModel, truncateJobDescription } from '../utils/tokenHelper.js'

function getOpenAIClient(apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('请在前端设置 OpenAI API Key 或配置服务端 OPENAI_API_KEY')
  }
  return new OpenAI({ apiKey: key })
}

export async function extractJobInfo(jobDescription, apiKey) {
  const openai = getOpenAIClient(apiKey)
  const jd = truncateJobDescription(jobDescription)
  try {
    const prompt = `提取公司名、职位名。只返回 JSON：{"companyName":"","position":""}，无则 ""。

${jd}`

    const completion = await openai.chat.completions.create({
      model: getLightModel(),
      messages: [
        { role: 'system', content: '只返回 JSON：companyName, position。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 150,
    })

    const responseText = completion.choices[0].message.content.trim()
    
    // 尝试解析JSON
    try {
      // 移除可能的markdown代码块标记
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const result = JSON.parse(jsonText)
      
      return {
        companyName: result.companyName || '',
        position: result.position || '',
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      console.error('响应内容:', responseText)
      // 如果解析失败，返回空值
      return {
        companyName: '',
        position: '',
      }
    }
  } catch (error) {
    console.error('AI识别失败:', error)
    // 如果AI识别失败，返回空值，让用户手动填写
    return {
      companyName: '',
      position: '',
    }
  }
}
