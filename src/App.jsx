import { useState, useEffect, useCallback } from 'react'
import ResumeUpload from './components/ResumeUpload'
import JobDescription from './components/JobDescription'
import OptimizedResume from './components/OptimizedResume'
import CoverLetter from './components/CoverLetter'
import ApplicationHistory from './components/ApplicationHistory'
import AnimatedBackground from './components/AnimatedBackground'
import GlassCard from './components/GlassCard'
import AppleButton from './components/AppleButton'
import { getPromptById } from './utils/promptStorage'
import { parseJobDescription } from './utils/jobDescriptionParser'
import { extractIndustryAndPosition } from './utils/jobInfoExtractor'
import { getApiKey, setApiKey } from './utils/apiKeyStorage'
import toast from 'react-hot-toast'
import { useI18n } from './contexts/I18nContext'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import OnboardingOverlay, { getOnboardingDone } from './components/OnboardingOverlay'
import RecordSuccessBanner from './components/RecordSuccessBanner'
import { getApplications, saveApplication, isDuplicateApplication } from './utils/applicationStorage'
import { Sparkles } from 'lucide-react'

function App() {
  const { token, user, login, register, logout, fetchWithAuth } = useAuth()
  const { locale, setLocale, t } = useI18n()
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [optimizedResume, setOptimizedResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [position, setPosition] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedCoverLetterPromptId, setSelectedCoverLetterPromptId] = useState('default')
  const [selectedResumePromptId, setSelectedResumePromptId] = useState('default')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [performanceMode, setPerformanceMode] = useState(true)
  const [promptsSyncedAt, setPromptsSyncedAt] = useState(0)
  const [onboardingDone, setOnboardingDone] = useState(() => getOnboardingDone())
  const [recordBannerMessage, setRecordBannerMessage] = useState(null)

  const autoRecordApplication = useCallback(
    async (companyNameVal, positionVal, jobDesc, resumeVal, coverLetterVal) => {
      let list = []
      try {
        if (token) {
          const res = await fetchWithAuth('/api/applications')
          if (res.ok) list = await res.json()
        } else {
          list = getApplications()
        }
      } catch (_) {
        list = []
      }
      if (isDuplicateApplication(list, companyNameVal, positionVal)) {
        setRecordBannerMessage(t('recordDuplicate'))
        return
      }
      const payload = {
        companyName: (companyNameVal || '').trim(),
        position: (positionVal || '').trim(),
        jobDescription: jobDesc || '',
        resume: resumeVal || '',
        coverLetter: coverLetterVal || '',
      }
      try {
        if (token) {
          const res = await fetchWithAuth('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error('Save failed')
        } else {
          saveApplication(payload)
        }
        setRecordBannerMessage(t('recordAutoSaved'))
      } catch (_) {
        setRecordBannerMessage(t('saveFailed'))
      }
    },
    [token, fetchWithAuth, t]
  )

  useEffect(() => {
    if (!token) return
    fetchWithAuth('/api/prompts')
      .then((r) => r.json())
      .then((data) => {
        if (data.resume && Array.isArray(data.resume) && data.resume.length > 0) {
          localStorage.setItem('resumeOptimizationPrompts', JSON.stringify(data.resume))
        }
        if (data.coverLetter && Array.isArray(data.coverLetter) && data.coverLetter.length > 0) {
          localStorage.setItem('coverLetterPrompts', JSON.stringify(data.coverLetter))
        }
        setPromptsSyncedAt((t) => t + 1)
      })
      .catch(() => {})
  }, [token, fetchWithAuth])

  const handleSyncPromptsToServer = useCallback(
    async (kind, data) => {
      if (!token || !Array.isArray(data)) return
      try {
        await fetchWithAuth('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, data }),
        })
      } catch (_) {}
    },
    [token, fetchWithAuth]
  )

  useEffect(() => {
    const savedCoverLetter = localStorage.getItem('selectedCoverLetterPromptId')
    if (savedCoverLetter) setSelectedCoverLetterPromptId(savedCoverLetter)
    const savedResumePrompt = localStorage.getItem('selectedResumePromptId')
    if (savedResumePrompt) setSelectedResumePromptId(savedResumePrompt)
    const savedResumeText = localStorage.getItem('resumeText')
    if (savedResumeText) setResumeText(savedResumeText)
    try {
      const savedPerf = localStorage.getItem('performanceMode')
      if (savedPerf !== null) setPerformanceMode(savedPerf === 'true')
    } catch (_e) {}
    setOpenaiApiKey(getApiKey())
  }, [])

  if (!token) {
    return <Auth onLogin={login} onRegister={register} />
  }

  const handleResumeUpload = (text) => {
    setResumeText(text)
    localStorage.setItem('resumeText', text)
    setActiveTab('job')
  }

  // 一键流程：岗位描述和简历只发一次，一次得到 职位信息 + 优化简历 + 推荐信
  const handleFullFlow = async () => {
    if (!openaiApiKey.trim()) {
      toast.error(t('setApiKeyFirst'))
      return
    }
    if (!resumeText || !jobDescription) {
      toast.error(t('uploadResumeFirst'))
      return
    }

    setLoading(true)
    try {
      const { getPromptById: getResumePromptById } = await import('./utils/resumePromptStorage')
      const resumeTemplate = getResumePromptById(selectedResumePromptId)
      const coverLetterTemplate = getPromptById(selectedCoverLetterPromptId)

      const { industry, position: posForPlaceholder } = extractIndustryAndPosition(jobDescription)
      let resumeInstruction = resumeTemplate?.prompt || ''
      resumeInstruction = resumeInstruction
        .replace(/{jobDescription}/g, jobDescription)
        .replace(/{resume}/g, resumeText)
        .replace(/{targetIndustry}/g, industry || t('defaultIndustry'))
        .replace(/{targetPosition}/g, posForPlaceholder || t('defaultPosition'))

      let coverLetterInstruction = coverLetterTemplate?.prompt || ''
      coverLetterInstruction = coverLetterInstruction
        .replace(/{jobDescription}/g, jobDescription)
        .replace(/{resume}/g, resumeText)

      const response = await fetch('/api/full-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey.trim(),
          resume: resumeText,
          jobDescription,
          resumeInstruction,
          resumeSystemPrompt: resumeTemplate?.systemPrompt,
          coverLetterInstruction,
          coverLetterSystemPrompt: coverLetterTemplate?.systemPrompt,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setCompanyName(data.companyName || '')
      setPosition(data.position || '')
      setOptimizedResume(data.optimizedResume || '')
      setCoverLetter(data.coverLetter || '')
      setActiveTab('resume')
      autoRecordApplication(
        data.companyName || '',
        data.position || '',
        jobDescription,
        data.optimizedResume || '',
        data.coverLetter || ''
      )
    } catch (error) {
      toast.error(t('oneClickFailed') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeResume = async () => {
    if (!openaiApiKey.trim()) {
      toast.error(t('setApiKeyFirst'))
      return
    }
    if (!resumeText || !jobDescription) {
      toast.error(t('uploadResumeFirst'))
      return
    }

    setLoading(true)
    try {
      const { getPromptById } = await import('./utils/resumePromptStorage')
      const promptTemplate = getPromptById(selectedResumePromptId)
      const { industry, position } = extractIndustryAndPosition(jobDescription)
      let processedPrompt = promptTemplate?.prompt || ''
      processedPrompt = processedPrompt
        .replace(/{jobDescription}/g, jobDescription)
        .replace(/{resume}/g, resumeText)
        .replace(/{targetIndustry}/g, industry || t('defaultIndustry'))
        .replace(/{targetPosition}/g, position || t('defaultPosition'))

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey.trim(),
          resume: resumeText,
          jobDescription,
          prompt: processedPrompt,
          systemPrompt: promptTemplate?.systemPrompt,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setOptimizedResume(data.optimizedResume)
      setActiveTab('resume')
    } catch (error) {
      alert(t('optimizeFailed') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!openaiApiKey.trim()) {
      toast.error(t('setApiKeyFirst'))
      return
    }
    if (!optimizedResume || !jobDescription) {
      toast.error(t('optimizeResumeFirst'))
      return
    }

    setLoading(true)
    try {
      const parsed = parseJobDescription(jobDescription)
      setCompanyName(parsed.companyName)
      setPosition(parsed.position)

      const promptTemplate = getPromptById(selectedCoverLetterPromptId)
      const companyInfoStr = [parsed.companyName, parsed.position].filter(Boolean).join(' | ') || ''
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey.trim(),
          resume: optimizedResume,
          jobDescription,
          prompt: promptTemplate?.prompt,
          systemPrompt: promptTemplate?.systemPrompt,
          companyInfo: companyInfoStr,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setCoverLetter(data.coverLetter)
      setActiveTab('coverLetter')
      autoRecordApplication(parsed.companyName, parsed.position, jobDescription, optimizedResume, data.coverLetter)
    } catch (error) {
      alert(t('coverLetterFailed') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCoverLetterPromptChange = (promptId) => {
    setSelectedCoverLetterPromptId(promptId)
    localStorage.setItem('selectedCoverLetterPromptId', promptId)
  }

  const handleResumePromptChange = (promptId) => {
    setSelectedResumePromptId(promptId)
    localStorage.setItem('selectedResumePromptId', promptId)
  }

  // 清空当前流程，重新开始（但保留投递记录和简历内容）
  const handleNextApplication = () => {
    // 保留上一份简历内容，方便多岗位复用
    setJobDescription('')
    setOptimizedResume('')
    setCoverLetter('')
    setCompanyName('')
    setPosition('')
    setActiveTab('job')
    // 注意：不清理投递记录，投递记录保存在 localStorage 中，会保留
  }

  const tabs = [
    { key: 'upload', label: t('tabUpload') },
    { key: 'job', label: t('tabJob') },
    { key: 'resume', label: t('tabResume'), disabled: !optimizedResume },
    { key: 'coverLetter', label: t('tabCoverLetter'), disabled: !coverLetter },
    { key: 'history', label: `📋 ${t('tabHistory')}` },
  ]

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground performanceMode={performanceMode} />
      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <GlassCard>
            <div className="p-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-white/90" />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{t('appTitle')}</h1>
                    <p className="text-slate-300 text-sm">{t('appSubtitle')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-300 text-sm mr-2">{user?.email}</span>
                  <AppleButton
                    variant="secondary"
                    onClick={() => {
                      const next = !performanceMode
                      setPerformanceMode(next)
                      try {
                        localStorage.setItem('performanceMode', String(next))
                      } catch (_e) {}
                    }}
                  >
                    {performanceMode ? '性能模式：开' : '性能模式：关'}
                  </AppleButton>
                  <AppleButton variant="secondary" onClick={logout}>{t('logout')}</AppleButton>
                  <AppleButton variant="secondary" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}>
                    {locale === 'zh' ? t('switchEn') : t('switchZh')}
                  </AppleButton>
                  <AppleButton
                    onClick={() => { setApiKeyInput(openaiApiKey); setShowApiKeyModal(true) }}
                    className={openaiApiKey.trim() ? 'bg-emerald-500/90 text-white hover:bg-emerald-500' : 'bg-amber-500/90 text-white hover:bg-amber-500'}
                  >
                    🔑 {openaiApiKey.trim() ? t('apiKeySet') : t('setApiKey')}
                  </AppleButton>
                  <AppleButton variant="secondary" onClick={() => setActiveTab('history')}>
                    📋 {t('viewHistory')}
                  </AppleButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {showApiKeyModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-white mb-2">{t('apiKeyModalTitle')}</h3>
                <p className="text-sm text-slate-400 mb-4">{t('apiKeyModalHint')}</p>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20 focus:border-white/20 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <AppleButton variant="secondary" onClick={() => setShowApiKeyModal(false)}>{t('cancel')}</AppleButton>
                  <AppleButton
                    onClick={() => {
                      const v = apiKeyInput.trim()
                      setApiKey(v)
                      setOpenaiApiKey(v)
                      setShowApiKeyModal(false)
                      if (v) toast.success(t('apiKeySaved'))
                    }}
                  >
                    {t('save')}
                  </AppleButton>
                </div>
              </div>
            </div>
          )}

          <GlassCard delay={0.05}>
            <div className="p-4 md:p-6">
              <nav className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
                {tabs.map(({ key, label, disabled }) => (
                  <button
                    key={key}
                    onClick={() => !disabled && setActiveTab(key)}
                    disabled={disabled}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === key
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              <div className="mt-6">
                {loading && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white mx-auto" />
                      <p className="mt-4 text-slate-300">{t('loading')}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'upload' && (
                  <ResumeUpload
                    onUpload={handleResumeUpload}
                    existingResume={resumeText}
                    selectedResumePromptId={selectedResumePromptId}
                    onResumePromptChange={handleResumePromptChange}
                    selectedCoverLetterPromptId={selectedCoverLetterPromptId}
                    onCoverLetterPromptChange={handleCoverLetterPromptChange}
                    onSyncPromptsToServer={handleSyncPromptsToServer}
                    promptsSyncedAt={promptsSyncedAt}
                  />
                )}

                {activeTab === 'job' && (
                  <JobDescription
                    jobDescription={jobDescription}
                    setJobDescription={setJobDescription}
                    onFullFlow={handleFullFlow}
                    onOptimize={handleOptimizeResume}
                    hasResume={!!resumeText}
                    resumeText={resumeText}
                    selectedResumePromptId={selectedResumePromptId}
                    onResumePromptChange={handleResumePromptChange}
                  />
                )}

                {activeTab === 'resume' && (
                  <OptimizedResume
                    originalResume={resumeText}
                    optimizedResume={optimizedResume}
                    companyName={companyName}
                    position={position}
                    onGenerateCoverLetter={handleGenerateCoverLetter}
                    selectedCoverLetterPromptId={selectedCoverLetterPromptId}
                    onCoverLetterPromptChange={handleCoverLetterPromptChange}
                    onAfterSaveCoverLetterPrompts={handleSyncPromptsToServer ? (data) => handleSyncPromptsToServer('coverLetter', data) : undefined}
                  />
                )}

                {activeTab === 'coverLetter' && (
                  <CoverLetter
                    coverLetter={coverLetter}
                    companyName={companyName}
                    position={position}
                    jobDescription={jobDescription}
                    resume={optimizedResume}
                    onNextApplication={handleNextApplication}
                    openaiApiKey={openaiApiKey}
                  />
                )}

                {activeTab === 'history' && <ApplicationHistory openaiApiKey={openaiApiKey} />}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {recordBannerMessage && (
        <RecordSuccessBanner
          message={recordBannerMessage}
          onClose={() => setRecordBannerMessage(null)}
        />
      )}

      {!onboardingDone && (
        <OnboardingOverlay onClose={() => setOnboardingDone(true)} />
      )}
    </div>
  )
}

export default App
