// 从岗位描述中提取公司名称和职位
export function parseJobDescription(jobDescription) {
  if (!jobDescription) {
    return { companyName: '', position: '' }
  }

  let companyName = ''
  let position = ''

  // 清理文本
  const text = jobDescription.trim()

  // 尝试提取公司名称 - 更全面的模式
  const companyPatterns = [
    /公司[：:]\s*([^\n\r]+?)(?:\n|$|岗位|职位|要求|职责)/i,
    /公司名称[：:]\s*([^\n\r]+?)(?:\n|$|岗位|职位|要求|职责)/i,
    /企业[：:]\s*([^\n\r]+?)(?:\n|$|岗位|职位|要求|职责)/i,
    /([^\n\r]+?)(?:有限公司|科技公司|股份有限公司|集团有限公司|信息技术有限公司|网络科技有限公司)/,
    /招聘公司[：:]\s*([^\n\r]+?)(?:\n|$)/i,
    /([A-Za-z0-9\u4e00-\u9fa5]+(?:有限公司|科技公司|股份有限公司|集团有限公司|信息技术有限公司|网络科技有限公司))/,
  ]

  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let extracted = match[1].trim()
      // 清理常见的后缀
      extracted = extracted.replace(/[：:]\s*$/, '').trim()
      if (extracted.length > 0 && extracted.length < 50) {
        companyName = extracted
        break
      }
    }
  }

  // 尝试提取职位 - 更全面的模式
  const positionPatterns = [
    /岗位[：:]\s*([^\n\r]+?)(?:\n|$|要求|职责|描述)/i,
    /职位[：:]\s*([^\n\r]+?)(?:\n|$|要求|职责|描述)/i,
    /招聘[：:]\s*([^\n\r]+?)(?:\n|$|要求|职责|描述)/i,
    /岗位名称[：:]\s*([^\n\r]+?)(?:\n|$)/i,
    /([^\n\r]+?)(?:工程师|开发工程师|前端工程师|后端工程师|全栈工程师|产品经理|运营专员|市场专员|销售|设计师|测试工程师|算法工程师|数据分析师|项目经理|技术总监|CTO|CEO)/,
    /(?:招聘|诚聘|急聘)\s*([^\n\r]+?)(?:\n|$|要求|职责)/i,
  ]

  for (const pattern of positionPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let extracted = match[1].trim()
      // 清理常见的后缀和前缀
      extracted = extracted.replace(/[：:]\s*$/, '').trim()
      extracted = extracted.replace(/^(招聘|诚聘|急聘)\s*/i, '').trim()
      if (extracted.length > 0 && extracted.length < 50) {
        position = extracted
        break
      }
    }
  }

  // 如果第一行包含公司或职位信息，尝试提取
  const lines = text.split(/\n|\r/).filter(line => line.trim())
  if (lines.length > 0) {
    // 检查前3行
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim()
      
      // 提取公司名称
      if (!companyName) {
        if (line.includes('公司') || line.includes('企业')) {
          let extracted = line
            .replace(/^(公司|企业)[：:]\s*/i, '')
            .replace(/[：:]\s*$/, '')
            .trim()
          
          // 提取公司名称部分（去掉后面的内容）
          const companyMatch = extracted.match(/^([^岗位职位要求职责\n]+)/)
          if (companyMatch) {
            extracted = companyMatch[1].trim()
          }
          
          if (extracted.length > 0 && extracted.length < 50) {
            companyName = extracted
          }
        }
      }
      
      // 提取职位
      if (!position) {
        if (line.includes('岗位') || line.includes('职位') || line.includes('招聘')) {
          let extracted = line
            .replace(/^(岗位|职位|招聘)[：:]\s*/i, '')
            .replace(/[：:]\s*$/, '')
            .trim()
          
          // 提取职位部分（去掉后面的内容）
          const positionMatch = extracted.match(/^([^要求职责描述\n]+)/)
          if (positionMatch) {
            extracted = positionMatch[1].trim()
          }
          
          if (extracted.length > 0 && extracted.length < 50) {
            position = extracted
          }
        }
      }
    }
  }

  // 如果还没有找到，尝试从常见格式中提取
  // 格式：公司：XXX 岗位：XXX
  if (!companyName || !position) {
    const formatMatch = text.match(/(?:公司|企业)[：:]\s*([^\n]+?)(?:\s+岗位|\s+职位|$)/i)
    if (formatMatch && !companyName) {
      companyName = formatMatch[1].trim()
    }
    
    const positionFormatMatch = text.match(/(?:岗位|职位)[：:]\s*([^\n]+?)(?:\s+要求|\s+职责|$)/i)
    if (positionFormatMatch && !position) {
      position = positionFormatMatch[1].trim()
    }
  }

  return {
    companyName: companyName || '',
    position: position || '',
  }
}
