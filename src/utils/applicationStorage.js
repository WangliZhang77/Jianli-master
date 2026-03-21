// 投递记录存储工具
import { messages } from './i18n'

const STORAGE_KEY = 'jobApplications'

export function getApplications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('读取投递记录失败:', error)
  }
  return []
}

/** 判断是否与已有记录重复（公司 + 职位一致视为重复） */
export function isDuplicateApplication(applications, companyName, position) {
  const n = (s) => (s || '').trim().toLowerCase()
  const company = n(companyName)
  const pos = n(position)
  if (!company && !pos) return false
  return applications.some(
    (app) => n(app.companyName) === company && n(app.position) === pos
  )
}

export function saveApplication(application) {
  try {
    const applications = getApplications()
    const newApplication = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...application
    }
    applications.unshift(newApplication) // 最新的在前面
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
    return newApplication
  } catch (error) {
    console.error('保存投递记录失败:', error)
    throw error
  }
}

export function deleteApplication(id) {
  try {
    const applications = getApplications()
    const filtered = applications.filter(app => app.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除投递记录失败:', error)
    throw error
  }
}

/** 清空本地投递记录（导入到账号后可选调用，避免重复导入） */
export function clearLocalApplications() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('清空本地投递记录失败:', error)
    throw error
  }
}

export function getApplicationsByDate(date) {
  const applications = getApplications()
  const targetDate = new Date(date).toDateString()
  return applications.filter(app => {
    const appDate = new Date(app.date).toDateString()
    return appDate === targetDate
  })
}

export function getApplicationsByMonth(year, month) {
  const applications = getApplications()
  return applications.filter(app => {
    const appDate = new Date(app.date)
    return appDate.getFullYear() === year && appDate.getMonth() === month
  })
}

/**
 * 按自然日统计投递次数。
 * @param {Array<{ date: string }>|null|undefined} applicationsOverride 传入时优先使用（登录后从服务端拉取的列表）；不传则从 localStorage 读
 */
export function getDailyCounts(applicationsOverride) {
  const applications = Array.isArray(applicationsOverride)
    ? applicationsOverride
    : getApplications()
  const counts = {}

  applications.forEach((app) => {
    if (!app?.date) return
    const date = new Date(app.date).toDateString()
    counts[date] = (counts[date] || 0) + 1
  })

  return counts
}

// 按岗位统计投递数量；locale 用于“未知职位”等文案
export function getPositionCounts(applications = null, locale = 'zh') {
  const apps = applications || getApplications()
  const counts = {}
  const unknown = messages[locale]?.unknownPosition ?? '未知职位'

  apps.forEach(app => {
    const position = app.position || unknown
    counts[position] = (counts[position] || 0) + 1
  })

  return Object.entries(counts)
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count)
}

// 按日期筛选应用记录
export function filterApplicationsByDateRange(applications, filterType, dateValue) {
  if (!dateValue) return applications
  
  const filterDate = new Date(dateValue)
  
  return applications.filter(app => {
    const appDate = new Date(app.date)
    
    switch (filterType) {
      case 'year':
        return appDate.getFullYear() === filterDate.getFullYear()
      case 'month':
        return appDate.getFullYear() === filterDate.getFullYear() && 
               appDate.getMonth() === filterDate.getMonth()
      case 'day':
        return appDate.toDateString() === filterDate.toDateString()
      default:
        return true
    }
  })
}

export function exportToCSV(applicationsOverride, locale = 'zh') {
  const applications = applicationsOverride ?? getApplications()
  const m = messages[locale] || messages.zh

  if (applications.length === 0) {
    throw new Error(m.noApplicationsExport || '没有投递记录可导出')
  }

  const headers = [m.csvDate, m.csvCompany, m.csvPosition, m.csvJobDesc, m.csvResume, m.csvCoverLetter]
  const rows = [headers.join(',')]
  
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'
  applications.forEach(app => {
    const row = [
      new Date(app.date).toLocaleString(dateLocale),
      `"${(app.companyName || '').replace(/"/g, '""')}"`,
      `"${(app.position || '').replace(/"/g, '""')}"`,
      `"${(app.jobDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(app.resume || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(app.coverLetter || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]
    rows.push(row.join(','))
  })
  
  return rows.join('\n')
}

export function exportToJSON(applicationsOverride) {
  const applications = applicationsOverride ?? getApplications()
  return JSON.stringify(applications, null, 2)
}
