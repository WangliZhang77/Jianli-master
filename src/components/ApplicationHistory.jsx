import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  getApplications,
  deleteApplication,
  clearLocalApplications,
  getDailyCounts,
  getPositionCounts,
  filterApplicationsByDateRange,
  exportToCSV,
  exportToJSON,
} from '../utils/applicationStorage'
import { classifyJobCategory } from '../utils/jobCategoryClassifier'
import { getAiCategoryCounts, getSeniorityCounts } from '../utils/applicationAiStats'
import { computeApplicationInsightStats } from '../utils/applicationInsightStats'
import InsightMarkdownLight from './InsightMarkdownLight'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'

function ApplicationHistory({ openaiApiKey = '' }) {
  const { token, fetchWithAuth } = useAuth()
  const { locale, t } = useI18n()
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'
  const weekDays = [t('weekDay0'), t('weekDay1'), t('weekDay2'), t('weekDay3'), t('weekDay4'), t('weekDay5'), t('weekDay6')]
  const [applications, setApplications] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar', or 'chart'
  const [selectedApp, setSelectedApp] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'year', 'month', 'day'
  const [filterDate, setFilterDate] = useState('')
  const [importing, setImporting] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const autoClassifyAttempted = useRef(false)
  const [insightText, setInsightText] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightGeneratedAt, setInsightGeneratedAt] = useState(null)
  const [insightCached, setInsightCached] = useState(false)
  const insightAutoAttempted = useRef(false)

  const localCount = token ? getApplications().length : 0

  const displayCategoryLabel = (app) => {
    if (app.jobCategoryAi) {
      const key = `jobAiCategory_${app.jobCategoryAi}`
      const label = t(key)
      return label === key ? app.jobCategoryAi : label
    }
    return t(`jobCategory_${classifyJobCategory(app)}`)
  }

  const displaySeniorityLabel = (app) => {
    if (!app.jobSeniorityAi) return t('seniority_unclassified')
    const key = `seniority_${app.jobSeniorityAi}`
    const label = t(key)
    return label === key ? app.jobSeniorityAi : label
  }

  const loadApplications = useCallback(async () => {
    if (token) {
      try {
        const res = await fetchWithAuth('/api/applications')
        if (!res.ok) throw new Error(t('loadFailed'))
        const data = await res.json()
        setApplications(data)
      } catch (e) {
        toast.error(e.message === 'Unauthorized' ? t('sessionExpired') : t('loadFailed') + ': ' + (e.message || e))
        setApplications([])
      }
    } else {
      setApplications(getApplications())
    }
  }, [token, fetchWithAuth, t])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  /** 登录且有记录时：自动触发一次 AI 分类（服务端：未分类 / 超过 24h 才实际调用模型） */
  useEffect(() => {
    if (applications.length === 0) {
      autoClassifyAttempted.current = false
      return
    }
    if (!token || !openaiApiKey?.trim()) return
    if (autoClassifyAttempted.current) return
    autoClassifyAttempted.current = true
    ;(async () => {
      try {
        const res = await fetchWithAuth('/api/applications/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: openaiApiKey.trim(), force: false }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.updated > 0) {
          await loadApplications()
        }
      } catch (_) {
        /* 静默失败，用户可手动点刷新 */
      }
    })()
  }, [token, openaiApiKey, applications.length, fetchWithAuth, loadApplications])

  const handleFetchInsight = async (force) => {
    if (!openaiApiKey?.trim()) {
      toast.error(t('insightNeedKey'))
      return
    }
    if (!token) {
      toast.error(t('insightLoginHint'))
      return
    }
    setInsightLoading(true)
    setInsightCached(false)
    try {
      const res = await fetchWithAuth('/api/applications/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey.trim(),
          force: !!force,
          locale: locale === 'en' ? 'en' : 'zh',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t('loadFailed'))
      setInsightText(data.insight || '')
      setInsightGeneratedAt(data.generatedAt || null)
      setInsightCached(!!data.cached)
      if (data.insight && !data.cached) {
        toast.success(locale === 'en' ? 'Insight updated' : '画像已更新')
      } else if (data.cached && data.insight) {
        toast(t('insightFromCache'))
      }
    } catch (e) {
      toast.error(e.message || String(e))
    } finally {
      setInsightLoading(false)
    }
  }

  useEffect(() => {
    insightAutoAttempted.current = false
    setInsightText('')
    setInsightGeneratedAt(null)
    setInsightCached(false)
  }, [locale])

  /** 登录且有 Key 时自动拉一次画像（服务端 24h 缓存，与分类策略一致） */
  useEffect(() => {
    if (applications.length === 0) {
      insightAutoAttempted.current = false
      setInsightText('')
      setInsightGeneratedAt(null)
      return
    }
    if (!token || !openaiApiKey?.trim()) return
    if (insightAutoAttempted.current) return
    insightAutoAttempted.current = true
    ;(async () => {
      try {
        const res = await fetchWithAuth('/api/applications/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: openaiApiKey.trim(),
            force: false,
            locale: locale === 'en' ? 'en' : 'zh',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.insight) {
          setInsightText(data.insight)
          setInsightGeneratedAt(data.generatedAt || null)
          setInsightCached(!!data.cached)
        }
      } catch (_) {
        /* 可手动点按钮 */
      }
    })()
  }, [token, openaiApiKey, applications.length, fetchWithAuth, locale])

  const handleAiClassify = async (force) => {
    if (!openaiApiKey?.trim()) {
      toast.error(t('aiClassifyNoKey'))
      return
    }
    setClassifying(true)
    try {
      const res = await fetchWithAuth('/api/applications/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openaiApiKey.trim(), force: !!force }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t('loadFailed'))
      if (data.skipped) {
        toast(t('aiClassifySkipped'))
      } else if (data.updated > 0) {
        toast.success(t('aiClassifyDone', { n: data.updated }))
        await loadApplications()
        insightAutoAttempted.current = false
        ;(async () => {
          try {
            if (!openaiApiKey?.trim() || !token) return
            const ir = await fetchWithAuth('/api/applications/insights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apiKey: openaiApiKey.trim(),
                force: false,
                locale: locale === 'en' ? 'en' : 'zh',
              }),
            })
            const idata = await ir.json().catch(() => ({}))
            if (ir.ok && idata.insight) {
              setInsightText(idata.insight)
              setInsightGeneratedAt(idata.generatedAt || null)
              setInsightCached(!!idata.cached)
            }
          } catch (_) {
            /* 画像可稍后手动刷新 */
          }
        })()
      } else {
        toast(t('aiClassifySkipped'))
      }
    } catch (e) {
      toast.error(e.message || String(e))
    } finally {
      setClassifying(false)
    }
  }

  /** 最近 N 个自然日（含今天）内的投递数 */
  const countApplicationsInLastDays = (apps, days) => {
    if (!Array.isArray(apps) || days < 1) return 0
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    return apps.filter((app) => {
      const d = new Date(app.date)
      return !Number.isNaN(d.getTime()) && d >= start && d <= end
    }).length
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    try {
      if (token) {
        const res = await fetchWithAuth(`/api/applications/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(t('deleteFailed'))
      } else {
        deleteApplication(id)
      }
      await loadApplications()
      if (selectedApp?.id === id) {
        setSelectedApp(null)
      }
    } catch (error) {
      toast.error(error.message === 'Unauthorized' ? t('sessionExpired') : t('deleteFailed') + ': ' + error.message)
    }
  }

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(applications, locale)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${locale === 'en' ? 'applications' : '投递记录'}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t('exportSuccess'))
    } catch (error) {
      toast.error(t('exportFailed') + ': ' + error.message)
    }
  }

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(applications)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${locale === 'en' ? 'applications' : '投递记录'}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t('exportSuccess'))
    } catch (error) {
      toast.error(t('exportFailed') + ': ' + error.message)
    }
  }

  const handleImportLocal = async () => {
    const local = getApplications()
    if (local.length === 0) {
      toast.error(t('noLocalRecordsToImport'))
      return
    }
    setImporting(true)
    try {
      const res = await fetchWithAuth('/api/applications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applications: local.map((app) => ({
            date: app.date,
            companyName: app.companyName || '',
            position: app.position || '',
            jobDescription: app.jobDescription || '',
            resume: app.resume || '',
            coverLetter: app.coverLetter || '',
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('loadFailed'))
      const imported = data.imported ?? local.length
      toast.success(t('importSuccess', { n: imported }))
      await loadApplications()
      if (confirm(t('importSuccessClear'))) {
        clearLocalApplications()
      }
    } catch (e) {
      toast.error(e.message === 'Unauthorized' ? t('sessionExpired') : t('importFailed') + (e.message || e))
    } finally {
      setImporting(false)
    }
  }

  const dailyCounts = useMemo(() => getDailyCounts(applications), [applications])
  const totalCount = applications.length

  const recent7 = useMemo(() => countApplicationsInLastDays(applications, 7), [applications])
  const recent30 = useMemo(() => countApplicationsInLastDays(applications, 30), [applications])
  const recent60 = useMemo(() => countApplicationsInLastDays(applications, 60), [applications])

  // 根据筛选条件过滤应用记录
  const filteredApplications = useMemo(() => {
    if (filterType === 'all' || !filterDate) {
      return applications
    }
    return filterApplicationsByDateRange(applications, filterType, filterDate)
  }, [applications, filterType, filterDate])

  const positionCounts = useMemo(() => getPositionCounts(filteredApplications, locale), [filteredApplications, locale])

  const aiCategoryCounts = useMemo(() => getAiCategoryCounts(filteredApplications), [filteredApplications])
  const seniorityCounts = useMemo(() => getSeniorityCounts(filteredApplications), [filteredApplications])
  /** 职级条按固定顺序排列，不能用第一项当 max，需取全局最大数量 */
  const maxSeniorityCount = useMemo(
    () => Math.max(1, ...seniorityCounts.map((i) => i.count)),
    [seniorityCounts]
  )

  /** 画像统计：始终用全部投递，与后端 /insights 一致 */
  const insightStats = useMemo(() => computeApplicationInsightStats(applications), [applications])

  // 获取当前月的日期和投递数量
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 填充前面的空位
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toDateString()
      const count = dailyCounts[dateString] || 0
      days.push({ day, date, count, dateString })
    }
    
    return days
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('historyTitle')}</h2>
          <p className="text-slate-300 mt-1">{t('totalRecords', { n: totalCount })}</p>
          {totalCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                {t('recentApplicationsSummary', { days: 7, count: recent7 })}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                {t('recentApplicationsSummary', { days: 30, count: recent30 })}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                {t('recentApplicationsSummary', { days: 60, count: recent60 })}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <AppleButton onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'primary' : 'secondary'}>
            📋 {t('viewList')}
          </AppleButton>
          <AppleButton onClick={() => setViewMode('calendar')} variant={viewMode === 'calendar' ? 'primary' : 'secondary'}>
            📅 {t('viewCalendar')}
          </AppleButton>
          <AppleButton onClick={() => setViewMode('chart')} variant={viewMode === 'chart' ? 'primary' : 'secondary'}>
            📊 {t('viewChart')}
          </AppleButton>
          <AppleButton onClick={handleExportCSV} className="!bg-emerald-500/90 text-white hover:!bg-emerald-500">
            {t('exportCSV')}
          </AppleButton>
          <AppleButton variant="secondary" onClick={handleExportJSON}>
            {t('exportJSON')}
          </AppleButton>
          {localCount > 0 && (
            <AppleButton
              onClick={handleImportLocal}
              disabled={importing}
              className="!bg-amber-500/90 text-white hover:!bg-amber-500 disabled:opacity-50"
            >
              {importing ? t('importingLabel') : t('importLocalRecordsCount', { n: localCount })}
            </AppleButton>
          )}
          {token && totalCount > 0 && (
            <>
              <AppleButton
                onClick={() => handleAiClassify(false)}
                disabled={classifying || !openaiApiKey?.trim()}
                className="!bg-violet-500/90 text-white hover:!bg-violet-500 disabled:opacity-50"
              >
                {classifying ? '…' : `🤖 ${t('aiClassifyBtn')}`}
              </AppleButton>
              <AppleButton
                variant="secondary"
                onClick={() => handleAiClassify(true)}
                disabled={classifying || !openaiApiKey?.trim()}
              >
                {t('aiClassifyForceBtn')}
              </AppleButton>
            </>
          )}
        </div>
      </div>

      {viewMode === 'chart' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center flex-wrap gap-4">
            <label className="text-sm font-medium text-slate-200">{t('timeFilter')}</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                if (e.target.value === 'all') setFilterDate('')
                else {
                  const today = new Date()
                  let dateValue = ''
                  if (e.target.value === 'year') dateValue = `${today.getFullYear()}-01-01`
                  else if (e.target.value === 'month') dateValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
                  else dateValue = today.toISOString().split('T')[0]
                  setFilterDate(dateValue)
                }
              }}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="all" className="bg-slate-800">{t('filterAll')}</option>
              <option value="year" className="bg-slate-800">{t('filterByYear')}</option>
              <option value="month" className="bg-slate-800">{t('filterByMonth')}</option>
              <option value="day" className="bg-slate-800">{t('filterByDay')}</option>
            </select>
            {filterType !== 'all' && (
              <input
                type={filterType === 'day' ? 'date' : filterType === 'month' ? 'month' : 'number'}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder={filterType === 'year' ? t('filterYear') : filterType === 'month' ? t('filterMonth') : t('filterDate')}
                min={filterType === 'year' ? '2020' : undefined}
                max={filterType === 'year' ? new Date().getFullYear() : undefined}
              />
            )}
            <span className="text-sm text-slate-400">{t('filterCount', { n: filteredApplications.length })}</span>
          </div>
        </div>
      )}

      {viewMode === 'chart' && totalCount > 0 && (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-cyan-500/25 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">{t('insightTitle')}</h3>
            <p className="text-sm text-slate-400 mt-1">{t('insightSubtitle')}</p>
            <p className="text-xs text-slate-500 mt-2">{t('insightBaseAll')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_total')}</div>
              <div className="text-lg font-bold text-white mt-1">{insightStats.total}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_activeDays')}</div>
              <div className="text-lg font-bold text-white mt-1">{insightStats.activeDays}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_avgActive')}</div>
              <div className="text-lg font-bold text-cyan-200 mt-1">{insightStats.avgPerActiveDay.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_avg7')}</div>
              <div className="text-lg font-bold text-cyan-200 mt-1">{insightStats.avgPerDayLast7.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_avg30')}</div>
              <div className="text-lg font-bold text-cyan-200 mt-1">{insightStats.avgPerDayLast30.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_last7')}</div>
              <div className="text-lg font-bold text-white mt-1">{insightStats.countLast7}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-slate-400">{t('insightStat_last30')}</div>
              <div className="text-lg font-bold text-white mt-1">{insightStats.countLast30}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-3 sm:col-span-2 lg:col-span-1">
              <div className="text-xs text-slate-400">{t('insightStat_peak')}</div>
              <div className="text-sm font-bold text-amber-200 mt-1">
                {insightStats.peakDay
                  ? `${insightStats.peakDay.date} · ${insightStats.peakDay.count}`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="text-lg font-semibold text-white">{t('insightAiBlockTitle')}</h4>
              <div className="flex flex-wrap gap-2">
                {token && (
                  <>
                    <AppleButton
                      onClick={() => handleFetchInsight(false)}
                      disabled={insightLoading || !openaiApiKey?.trim()}
                      className="!bg-cyan-600/90 text-white hover:!bg-cyan-600 disabled:opacity-50"
                    >
                      {insightLoading ? t('insightLoading') : `✨ ${t('insightFetchBtn')}`}
                    </AppleButton>
                    <AppleButton variant="secondary" onClick={() => handleFetchInsight(true)} disabled={insightLoading || !openaiApiKey?.trim()}>
                      {t('insightRefreshBtn')}
                    </AppleButton>
                  </>
                )}
              </div>
            </div>
            {!token && <p className="text-sm text-slate-400 mb-3">{t('insightLoginHint')}</p>}
            {token && !openaiApiKey?.trim() && <p className="text-sm text-amber-200/90 mb-3">{t('insightNeedKey')}</p>}
            {insightGeneratedAt && (
              <p className="text-xs text-slate-500 mb-3">
                {t('insightGeneratedAt')}: {new Date(insightGeneratedAt).toLocaleString(dateLocale)}
                {insightCached ? ` · ${t('insightCachedBadge')}` : ''}
              </p>
            )}
            {insightLoading && !insightText && (
              <div className="text-slate-400 text-sm py-6">{t('insightLoading')}</div>
            )}
            {insightText ? (
              <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                <InsightMarkdownLight text={insightText} />
              </div>
            ) : (
              !insightLoading &&
              token &&
              openaiApiKey?.trim() && <p className="text-sm text-slate-500">{t('insightEmptyHint')}</p>
            )}
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <AppleButton variant="secondary" onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d) }} className="!py-1.5 !px-3">
              {t('prevMonth')}
            </AppleButton>
            <h3 className="text-lg font-bold text-white">
              {locale === 'en' ? `${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}` : `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1}月`}
            </h3>
            <AppleButton variant="secondary" onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d) }} className="!py-1.5 !px-3">
              {t('nextMonth')}
            </AppleButton>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-bold text-slate-400 py-2">{day}</div>
            ))}
            {calendarDays.map((dayData, index) => {
              if (!dayData) return <div key={index} className="h-20" />
              const isToday = dayData.dateString === new Date().toDateString()
              const bgColor = dayData.count > 0 ? (dayData.count >= 5 ? 'bg-red-500' : dayData.count >= 3 ? 'bg-orange-500' : 'bg-green-500') : 'bg-white/10'
              return (
                <div
                  key={index}
                  className={`h-20 border border-white/10 rounded-lg p-2 cursor-pointer hover:bg-white/5 transition-colors ${isToday ? 'ring-2 ring-white/40' : ''}`}
                  onClick={() => {
                    const dayApps = applications.filter(app => new Date(app.date).toDateString() === dayData.dateString)
                    if (dayApps.length > 0) setSelectedApp({ date: dayData.date, applications: dayApps })
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-slate-300'}`}>{dayData.day}</span>
                    {dayData.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded text-white ${bgColor}`}>{dayData.count}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded" /><span>{t('count1to2')}</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded" /><span>{t('count3to4')}</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded" /><span>{t('count5plus')}</span></div>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">{t('positionStats')}</h3>
          {positionCounts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <p className="text-slate-400">{t('noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positionCounts.map((item, index) => {
                const maxCount = positionCounts[0]?.count || 1
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-200 truncate flex-1 mr-4">{item.position}</span>
                      <span className="text-sm font-bold text-white min-w-[3rem] text-right">{item.count}{t('countUnit') ? ` ${t('countUnit')}` : ''}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500" style={{ width: `${percentage}%` }}>
                        {item.count > 0 && <span className="text-xs text-white font-medium">{item.count}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">{t('aiStatsTitle')}</h3>
            <p className="text-sm text-slate-400 mb-6">{t('aiStatsHint')}</p>
            {aiCategoryCounts.length === 0 || (aiCategoryCounts.length === 1 && aiCategoryCounts[0].category === 'unclassified') ? (
              <div className="text-center py-8 bg-white/5 rounded-xl text-slate-400 text-sm">
                {t('jobAiCategory_unclassified')} — {t('aiClassifyBtn')}
              </div>
            ) : (
              <div className="space-y-4">
                {aiCategoryCounts.map((item) => {
                  const maxCount = aiCategoryCounts[0]?.count || 1
                  const percentage = (item.count / maxCount) * 100
                  const key = `jobAiCategory_${item.category}`
                  const label = t(key) === key ? item.category : t(key)
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-200 truncate flex-1 mr-4">{label}</span>
                        <span className="text-sm font-bold text-white min-w-[3rem] text-right">
                          {item.count}
                          {t('countUnit') ? ` ${t('countUnit')}` : ''}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          {item.count > 0 && <span className="text-xs text-white font-medium">{item.count}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">{t('aiSeniorityTitle')}</h3>
            {seniorityCounts.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl text-slate-400 text-sm">{t('noRecords')}</div>
            ) : (
              <div className="space-y-4">
                {seniorityCounts.map((item) => {
                  const label = t(`seniority_${item.seniority}`)
                  const rawPct = maxSeniorityCount > 0 ? (item.count / maxSeniorityCount) * 100 : 0
                  // 占比很小时仍保留约 5% 宽度，避免细条几乎看不见
                  const percentage =
                    item.count <= 0 ? 0 : Math.min(100, Math.max(rawPct, rawPct < 5 ? 5 : rawPct))
                  const barNarrow = rawPct > 0 && rawPct < 12
                  return (
                    <div key={item.seniority} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-200 truncate flex-1 mr-4">{label}</span>
                        <span className="text-sm font-bold text-white min-w-[3rem] text-right">
                          {item.count}
                          {t('countUnit') ? ` ${t('countUnit')}` : ''}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden min-w-0">
                        <div
                          className={`bg-gradient-to-r from-amber-500 to-rose-500 h-6 rounded-full flex items-center transition-all duration-500 ${
                            barNarrow ? 'justify-start pl-2 min-w-0' : 'justify-end pr-2'
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          {item.count > 0 && <span className="text-xs text-white font-medium shrink-0">{item.count}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-bold text-white">{filteredApplications.length}</div><div className="text-sm text-slate-400">{t('totalApplications')}</div></div>
            <div><div className="text-2xl font-bold text-white">{positionCounts.length}</div><div className="text-sm text-slate-400">{t('positionTypes')}</div></div>
            <div><div className="text-2xl font-bold text-white">{positionCounts.length > 0 ? (filteredApplications.length / positionCounts.length).toFixed(1) : 0}</div><div className="text-sm text-slate-400">{t('avgApplications')}</div></div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <p className="text-slate-400">{t('noRecordsHint')}</p>
              <p className="text-sm text-slate-500 mt-2">{t('noRecordsHint2')}</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedApp({ date: new Date(app.date), applications: [app] })}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{app.companyName}</h3>
                      <span className="px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-lg">{app.position}</span>
                      <span className="px-2 py-1 bg-cyan-500/15 text-cyan-200 text-xs rounded-lg border border-cyan-400/25">
                        {displayCategoryLabel(app)}
                      </span>
                      {app.jobSeniorityAi && (
                        <span className="px-2 py-1 bg-violet-500/15 text-violet-200 text-xs rounded-lg border border-violet-400/25">
                          {displaySeniorityLabel(app)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{new Date(app.date).toLocaleString(dateLocale)}</p>
                    {app.jobDescription && (
                      <p className="text-sm text-slate-300 mt-2 line-clamp-2">{app.jobDescription.substring(0, 100)}...</p>
                    )}
                  </div>
                  <AppleButton variant="secondary" onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }} className="!py-1 !px-3 text-sm !bg-red-500/20 !text-red-200 !border-red-400/30 hover:!bg-red-500/30">
                    {t('delete')}
                  </AppleButton>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{t('detailTitle')} - {new Date(selectedApp.date).toLocaleDateString(dateLocale)}</h2>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedApp.applications.map((app) => (
                <div key={app.id} className="border-b border-white/10 pb-6 last:border-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{app.companyName} - {app.position}</h3>
                    <p className="text-sm text-slate-300 mb-1">
                      {t('jobCategoryLabel')}：{displayCategoryLabel(app)}
                    </p>
                    <p className="text-sm text-slate-300 mb-1">
                      {t('jobSeniorityLabel')}：{displaySeniorityLabel(app)}
                    </p>
                    <p className="text-sm text-slate-400">{new Date(app.date).toLocaleString(dateLocale)}</p>
                  </div>
                  {app.jobDescription && (
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-200 mb-2">{t('jobDescLabel')}</h4>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10"><pre className="whitespace-pre-wrap text-sm text-slate-300">{app.jobDescription}</pre></div>
                    </div>
                  )}
                  {app.resume && (
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-200 mb-2">{t('resumeContentLabel')}</h4>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 max-h-40 overflow-y-auto"><pre className="whitespace-pre-wrap text-sm text-slate-300">{app.resume.substring(0, 500)}...</pre></div>
                    </div>
                  )}
                  {app.coverLetter && (
                    <div>
                      <h4 className="font-medium text-slate-200 mb-2">{t('coverLetterLabel')}</h4>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 max-h-60 overflow-y-auto"><pre className="whitespace-pre-wrap text-sm text-slate-300">{app.coverLetter}</pre></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-4 flex justify-end">
              <AppleButton variant="secondary" onClick={() => setSelectedApp(null)}>{t('close')}</AppleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationHistory
