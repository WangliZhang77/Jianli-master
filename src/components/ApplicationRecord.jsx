import { useState, useEffect } from 'react'
import { saveApplication } from '../utils/applicationStorage'
import { parseJobDescription } from '../utils/jobDescriptionParser'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'

function ApplicationRecord({
  companyName,
  position,
  jobDescription,
  resume,
  coverLetter,
  onRecorded,
  onCancel,
  openaiApiKey = '',
}) {
  const { token } = useAuth()
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    companyName: companyName || '',
    position: position || '',
    jobDescription: jobDescription || '',
  })

  const [autoDetected, setAutoDetected] = useState(false)
  const [aiDetecting, setAiDetecting] = useState(false)

  // 当对话框打开时，使用AI自动识别公司名称和职位
  useEffect(() => {
    const detectWithAI = async () => {
      if (jobDescription && (!formData.companyName || !formData.position)) {
        setAiDetecting(true)
        try {
          // 首先尝试使用AI识别
          const response = await fetch('/api/extract-job-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobDescription, apiKey: openaiApiKey.trim() }),
          })

          if (response.ok) {
            const aiResult = await response.json()
            if (aiResult.companyName || aiResult.position) {
              setFormData(prev => ({
                ...prev,
                companyName: prev.companyName || aiResult.companyName || '',
                position: prev.position || aiResult.position || '',
              }))
              setAutoDetected(true)
              setAiDetecting(false)
              return
            }
          }
        } catch (error) {
          console.error('AI识别失败，使用备用方法:', error)
        }

        // 如果AI识别失败，使用正则表达式备用方法
        const parsed = parseJobDescription(jobDescription)
        if (parsed.companyName || parsed.position) {
          setFormData(prev => ({
            ...prev,
            companyName: prev.companyName || parsed.companyName,
            position: prev.position || parsed.position,
          }))
          if (parsed.companyName || parsed.position) {
            setAutoDetected(true)
          }
        }
        setAiDetecting(false)
      }
    }

    detectWithAI()
  }, [jobDescription])

  const handleSave = async () => {
    if (!formData.companyName.trim() || !formData.position.trim()) {
      alert(t('fillCompanyPosition'))
      return
    }

    const payload = {
      companyName: formData.companyName.trim(),
      position: formData.position.trim(),
      jobDescription: formData.jobDescription || jobDescription || '',
      resume: resume || '',
      coverLetter: coverLetter || '',
    }

    try {
      if (token) {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(t('saveFailed'))
      } else {
        saveApplication(payload)
      }
      alert(t('recordSaved'))
      onRecorded()
    } catch (error) {
      alert(t('saveFailed') + ': ' + error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('recordDelivery')}</h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {aiDetecting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">
                  🤖 {t('aiDetecting')}
                </p>
              </div>
            </div>
          )}
          {autoDetected && !aiDetecting && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ AI 已自动识别公司名称和职位，请确认或修改
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyLabel')} <span className="text-red-500">*</span>
                {autoDetected && formData.companyName && (
                  <span className="ml-2 text-xs text-green-600">{t('autoDetectedTag')}</span>
                )}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder={t('companyNamePlaceholder')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('positionLabel')} <span className="text-red-500">*</span>
                {autoDetected && formData.position && (
                  <span className="ml-2 text-xs text-green-600">{t('autoDetectedTag')}</span>
                )}
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t('positionPlaceholder')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('jobDescJd')}
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder={t('jobDescPlaceholder')}
                rows="6"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 {t('hintResumeCoverAuto')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('saveRecord')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApplicationRecord
