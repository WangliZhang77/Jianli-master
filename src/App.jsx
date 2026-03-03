import { useState, useEffect } from 'react'
import ResumeUpload from './components/ResumeUpload'
import JobDescription from './components/JobDescription'
import OptimizedResume from './components/OptimizedResume'
import CoverLetter from './components/CoverLetter'
import ApplicationHistory from './components/ApplicationHistory'
import { getPromptById } from './utils/promptStorage'
import { parseJobDescription } from './utils/jobDescriptionParser'
import { extractIndustryAndPosition } from './utils/jobInfoExtractor'
import { getApiKey, setApiKey } from './utils/apiKeyStorage'
import { useI18n } from './contexts/I18nContext'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'

function App() {
  const { token, user, login, register, logout } = useAuth()
  const { locale, setLocale, t } = useI18n()

  if (!token) {
    return <Auth onLogin={login} onRegister={register} />
  }
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

  // 从 localStorage 加载
  useEffect(() => {
    const savedCoverLetter = localStorage.getItem('selectedCoverLetterPromptId')
    if (savedCoverLetter) setSelectedCoverLetterPromptId(savedCoverLetter)
    const savedResumePrompt = localStorage.getItem('selectedResumePromptId')
    if (savedResumePrompt) setSelectedResumePromptId(savedResumePrompt)
    const savedResumeText = localStorage.getItem('resumeText')
    if (savedResumeText) setResumeText(savedResumeText)
    setOpenaiApiKey(getApiKey())
  }, [])

  const handleResumeUpload = (text) => {
    setResumeText(text)
    localStorage.setItem('resumeText', text)
    setActiveTab('job')
  }

  // 一键流程：岗位描述和简历只发一次，一次得到 职位信息 + 优化简历 + 推荐信
  const handleFullFlow = async () => {
    if (!openaiApiKey.trim()) {
      alert(t('setApiKeyFirst'))
      return
    }
    if (!resumeText || !jobDescription) {
      alert(t('uploadResumeFirst'))
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
      // 一键流程完成后先查看优化简历，再到推荐信
      setActiveTab('resume')
    } catch (error) {
      alert(t('oneClickFailed') + ': ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeResume = async () => {
    if (!openaiApiKey.trim()) {
      alert(t('setApiKeyFirst'))
      return
    }
    if (!resumeText || !jobDescription) {
      alert(t('uploadResumeFirst'))
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
      alert(t('setApiKeyFirst'))
      return
    }
    if (!optimizedResume || !jobDescription) {
      alert(t('optimizeResumeFirst'))
      return
    }

    setLoading(true)
    try {
      const parsed = parseJobDescription(jobDescription)
      setCompanyName(parsed.companyName)
      setPosition(parsed.position)

      const promptTemplate = getPromptById(selectedCoverLetterPromptId)
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey.trim(),
          resume: optimizedResume,
          jobDescription,
          prompt: promptTemplate?.prompt,
          systemPrompt: promptTemplate?.systemPrompt,
        }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setCoverLetter(data.coverLetter)
      setActiveTab('coverLetter')
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('appTitle')}</h1>
                <p className="text-purple-100">{t('appSubtitle')}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/90 text-sm mr-2">{user?.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm"
                >
                  {t('logout')}
                </button>
                <button
                  type="button"
                  onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                  className="px-3 py-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-sm font-medium"
                >
                  {locale === 'zh' ? t('switchEn') : t('switchZh')}
                </button>
                <button
                  onClick={() => {
                    setApiKeyInput(openaiApiKey)
                    setShowApiKeyModal(true)
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${openaiApiKey.trim() ? 'bg-green-500 bg-opacity-90 hover:bg-opacity-100' : 'bg-amber-500 bg-opacity-90 hover:bg-opacity-100'}`}
                >
                  {openaiApiKey.trim() ? `🔑 ${t('apiKeySet')}` : `🔑 ${t('setApiKey')}`}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white font-medium transition-all"
                >
                  📋 {t('viewHistory')}
                </button>
              </div>
            </div>
          </div>

          {/* 设置 API Key 弹窗 */}
          {showApiKeyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{t('apiKeyModalTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4">{t('apiKeyModalHint')}</p>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => {
                      const v = apiKeyInput.trim()
                      setApiKey(v)
                      setOpenaiApiKey(v)
                      setShowApiKeyModal(false)
                      if (v) alert(t('apiKeySaved'))
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabUpload')}
              </button>
              <button
                onClick={() => setActiveTab('job')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'job'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabJob')}
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'resume'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={!optimizedResume}
              >
                {t('tabResume')}
              </button>
              <button
                onClick={() => setActiveTab('coverLetter')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'coverLetter'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={!coverLetter}
              >
                {t('tabCoverLetter')}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 {t('tabHistory')}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t('loading')}</p>
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
                onGenerateCoverLetter={handleGenerateCoverLetter}
                selectedCoverLetterPromptId={selectedCoverLetterPromptId}
                onCoverLetterPromptChange={handleCoverLetterPromptChange}
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

            {activeTab === 'history' && (
              <ApplicationHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
