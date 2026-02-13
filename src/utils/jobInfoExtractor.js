// 从岗位描述中提取行业和岗位信息（用于简历优化）
export function extractIndustryAndPosition(jobDescription) {
  if (!jobDescription) {
    return { industry: '', position: '' }
  }

  // 常见行业关键词
  const industries = [
    '互联网', 'IT', '软件', '科技', '金融', '电商', '教育', '医疗', 
    '制造业', '房地产', '咨询', '广告', '媒体', '游戏', '人工智能',
    '大数据', '云计算', '区块链', '物联网', '新能源', '汽车'
  ]

  // 常见岗位关键词
  const positions = [
    '工程师', '开发', '研发', '产品', '运营', '市场', '销售', 
    '设计', '测试', '算法', '数据分析', '项目经理', '技术总监',
    '架构师', '前端', '后端', '全栈', '移动端', '运维', '安全'
  ]

  let industry = ''
  let position = ''

  // 尝试从JD中提取行业
  for (const ind of industries) {
    if (jobDescription.includes(ind)) {
      industry = ind
      break
    }
  }

  // 尝试从JD中提取岗位
  for (const pos of positions) {
    if (jobDescription.includes(pos)) {
      position = pos
      break
    }
  }

  // 如果没有找到，尝试从常见格式中提取
  if (!industry) {
    const industryMatch = jobDescription.match(/(互联网|IT|科技|金融|电商|教育|医疗|制造业|咨询|广告|媒体|游戏|人工智能|大数据|云计算|区块链|物联网|新能源|汽车)/)
    if (industryMatch) {
      industry = industryMatch[1]
    }
  }

  if (!position) {
    const positionMatch = jobDescription.match(/(工程师|开发|研发|产品|运营|市场|销售|设计|测试|算法|数据分析|项目经理|技术总监|架构师|前端|后端|全栈|移动端|运维|安全)/)
    if (positionMatch) {
      position = positionMatch[1]
    }
  }

  return {
    industry: industry || '互联网',
    position: position || '工程师',
  }
}
