import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  getApplications, 
  deleteApplication, 
  clearLocalApplications,
  getDailyCounts,
  getPositionCounts,
  filterApplicationsByDateRange,
  exportToCSV,
  exportToJSON 
} from '../utils/applicationStorage'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'

function ApplicationHistory() {
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

  const localCount = token ? getApplications().length : 0

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
  }, [token])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

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

  const dailyCounts = useMemo(() => getDailyCounts(), [applications])
  const totalCount = applications.length

  // 根据筛选条件过滤应用记录
  const filteredApplications = useMemo(() => {
    if (filterType === 'all' || !filterDate) {
      return applications
    }
    return filterApplicationsByDateRange(applications, filterType, filterDate)
  }, [applications, filterType, filterDate])

  const positionCounts = useMemo(() => getPositionCounts(filteredApplications, locale), [filteredApplications, locale])

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('historyTitle')}</h2>
          <p className="text-gray-600 mt-1">
            {t('totalRecords', { n: totalCount })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 {t('viewList')}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'calendar' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📅 {t('viewCalendar')}
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'chart' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 {t('viewChart')}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('exportCSV')}
          </button>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('exportJSON')}
          </button>
          {localCount > 0 && (
            <button
              type="button"
              onClick={handleImportLocal}
              disabled={importing}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {importing ? t('importingLabel') : t('importLocalRecordsCount', { n: localCount })}
            </button>
          )}
        </div>
      </div>

      {/* 时间筛选器 */}
      {viewMode === 'chart' && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">{t('timeFilter')}</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                if (e.target.value === 'all') {
                  setFilterDate('')
                } else {
                  const today = new Date()
                  let dateValue = ''
                  if (e.target.value === 'year') {
                    dateValue = `${today.getFullYear()}-01-01`
                  } else if (e.target.value === 'month') {
                    dateValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
                  } else {
                    dateValue = today.toISOString().split('T')[0]
                  }
                  setFilterDate(dateValue)
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t('filterAll')}</option>
              <option value="year">{t('filterByYear')}</option>
              <option value="month">{t('filterByMonth')}</option>
              <option value="day">{t('filterByDay')}</option>
            </select>
            {filterType !== 'all' && (
              <input
                type={filterType === 'day' ? 'date' : filterType === 'month' ? 'month' : 'number'}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={filterType === 'year' ? t('filterYear') : filterType === 'month' ? t('filterMonth') : t('filterDate')}
                min={filterType === 'year' ? '2020' : undefined}
                max={filterType === 'year' ? new Date().getFullYear() : undefined}
              />
            )}
            <span className="text-sm text-gray-600">
              {t('filterCount', { n: filteredApplications.length })}
            </span>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() - 1)
                setSelectedDate(newDate)
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              {t('prevMonth')}
            </button>
            <h3 className="text-lg font-bold">
              {locale === 'en' ? `${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}` : `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1}月`}
            </h3>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() + 1)
                setSelectedDate(newDate)
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              {t('nextMonth')}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((dayData, index) => {
              if (!dayData) {
                return <div key={index} className="h-20"></div>
              }
              
              const isToday = dayData.dateString === new Date().toDateString()
              const bgColor = dayData.count > 0 
                ? dayData.count >= 5 
                  ? 'bg-red-500' 
                  : dayData.count >= 3 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
                : 'bg-gray-100'
              
              return (
                <div
                  key={index}
                  className={`h-20 border border-gray-200 rounded p-2 cursor-pointer hover:shadow-md transition-shadow ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    const dayApps = applications.filter(app => {
                      const appDate = new Date(app.date).toDateString()
                      return appDate === dayData.dateString
                    })
                    if (dayApps.length > 0) {
                      setSelectedApp({ date: dayData.date, applications: dayApps })
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {dayData.day}
                    </span>
                    {dayData.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded text-white ${bgColor}`}>
                        {dayData.count}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>{t('count1to2')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>{t('count3to4')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>{t('count5plus')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {t('positionStats')}
          </h3>
          
          {positionCounts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t('noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positionCounts.map((item, index) => {
                const maxCount = positionCounts[0]?.count || 1
                const percentage = (item.count / maxCount) * 100
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-4">
                        {item.position}
                      </span>
                      <span className="text-sm font-bold text-purple-600 min-w-[3rem] text-right">
                        {item.count}{t('countUnit') ? ` ${t('countUnit')}` : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs text-white font-medium">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredApplications.length}
                </div>
                <div className="text-sm text-gray-600">{t('totalApplications')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {positionCounts.length}
                </div>
                <div className="text-sm text-gray-600">{t('positionTypes')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {positionCounts.length > 0 
                    ? (filteredApplications.length / positionCounts.length).toFixed(1)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">{t('avgApplications')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t('noRecordsHint')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('noRecordsHint2')}</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedApp({ date: new Date(app.date), applications: [app] })}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {app.companyName}
                      </h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {app.position}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(app.date).toLocaleString(dateLocale)}
                    </p>
                    {app.jobDescription && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {app.jobDescription.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(app.id)
                    }}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {t('detailTitle')} - {new Date(selectedApp.date).toLocaleDateString(dateLocale)}
              </h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedApp.applications.map((app) => (
                <div key={app.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {app.companyName} - {app.position}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(app.date).toLocaleString(dateLocale)}
                    </p>
                  </div>

                  {app.jobDescription && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">{t('jobDescLabel')}</h4>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {app.jobDescription}
                        </pre>
                      </div>
                    </div>
                  )}

                  {app.resume && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">{t('resumeContentLabel')}</h4>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {app.resume.substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  )}

                  {app.coverLetter && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('coverLetterLabel')}</h4>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200 max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {app.coverLetter}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationHistory
