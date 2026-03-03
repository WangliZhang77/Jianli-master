import { useState, useEffect } from 'react'
import { saveApplication } from '../utils/applicationStorage'
import { parseJobDescription } from '../utils/jobDescriptionParser'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
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
  const { token, fetchWithAuth } = useAuth()
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
      toast.error(t('fillCompanyPosition'))
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
        const res = await fetchWithAuth('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(t('saveFailed'))
      } else {
        saveApplication(payload)
      }
      toast.success(t('recordSaved'))
      onRecorded()
    } catch (error) {
      toast.error(error.message === 'Unauthorized' ? t('sessionExpired') : t('saveFailed') + ': ' + error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t('recordDelivery')}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aiDetecting && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                <p className="text-sm text-blue-200">🤖 {t('aiDetecting')}</p>
              </div>
            </div>
          )}
          {autoDetected && !aiDetecting && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
              <p className="text-sm text-emerald-200">✅ AI 已自动识别公司名称和职位，请确认或修改</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t('companyLabel')} <span className="text-red-400">*</span>
                {autoDetected && formData.companyName && (
                  <span className="ml-2 text-xs text-emerald-400">{t('autoDetectedTag')}</span>
                )}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder={t('companyNamePlaceholder')}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t('positionLabel')} <span className="text-red-400">*</span>
                {autoDetected && formData.position && (
                  <span className="ml-2 text-xs text-emerald-400">{t('autoDetectedTag')}</span>
                )}
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder={t('positionPlaceholder')}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('jobDescJd')}</label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder={t('jobDescPlaceholder')}
                rows={6}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20 resize-none"
              />
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-400/30">
              <p className="text-sm text-blue-200">💡 {t('hintResumeCoverAuto')}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4 flex justify-end gap-2">
          <AppleButton variant="secondary" onClick={onCancel}>{t('cancel')}</AppleButton>
          <AppleButton onClick={handleSave} className="!bg-emerald-500/90 text-white hover:!bg-emerald-500">
            {t('saveRecord')}
          </AppleButton>
        </div>
      </div>
    </div>
  )
}

export default ApplicationRecord
