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

export async function extractJobInfo(jobDescription) {
  const openai = getOpenAIClient()
  try {
    const prompt = `请从以下岗位描述中提取公司名称和职位名称。只返回JSON格式，包含两个字段：companyName 和 position。

岗位描述：
${jobDescription}

要求：
1. 如果找到了公司名称，返回在 companyName 字段中
2. 如果找到了职位名称，返回在 position 字段中
3. 如果某个信息找不到，返回空字符串 ""
4. 只返回JSON，不要添加任何其他文字说明
5. 使用中文返回

返回格式示例：
{
  "companyName": "XX科技有限公司",
  "position": "高级前端开发工程师"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的信息提取助手，擅长从文本中提取公司名称和职位信息。只返回JSON格式。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
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
