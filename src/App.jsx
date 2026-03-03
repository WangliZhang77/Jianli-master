import { useState, useEffect } from 'react'
import ResumeUpload from './components/ResumeUpload'
import JobDescription from './components/JobDescription'
import OptimizedResume from './components/OptimizedResume'
import CoverLetter from './components/CoverLetter'
import ApplicationHistory from './components/ApplicationHistory'
import { getPromptById } from './utils/promptStorage'
import { parseJobDescription } from './utils/jobDescriptionParser'
import { extractIndustryAndPosition } from './utils/jobInfoExtractor'

function App() {
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

  // 从 localStorage 加载上次选择的提示词和最近一次简历内容
  useEffect(() => {
    const savedCoverLetter = localStorage.getItem('selectedCoverLetterPromptId')
    if (savedCoverLetter) {
      setSelectedCoverLetterPromptId(savedCoverLetter)
    }
    const savedResumePrompt = localStorage.getItem('selectedResumePromptId')
    if (savedResumePrompt) {
      setSelectedResumePromptId(savedResumePrompt)
    }
    const savedResumeText = localStorage.getItem('resumeText')
    if (savedResumeText) {
      setResumeText(savedResumeText)
    }
  }, [])

  const handleResumeUpload = (text) => {
    setResumeText(text)
    localStorage.setItem('resumeText', text)
    setActiveTab('job')
  }

  // 一键流程：岗位描述和简历只发一次，一次得到 职位信息 + 优化简历 + 推荐信
  const handleFullFlow = async () => {
    if (!resumeText || !jobDescription) {
      alert('请先上传简历和输入岗位描述')
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
        .replace(/{targetIndustry}/g, industry || '互联网')
        .replace(/{targetPosition}/g, posForPlaceholder || '工程师')

      let coverLetterInstruction = coverLetterTemplate?.prompt || ''
      coverLetterInstruction = coverLetterInstruction
        .replace(/{jobDescription}/g, jobDescription)
        .replace(/{resume}/g, resumeText)

      const response = await fetch('/api/full-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      alert('一键生成失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeResume = async () => {
    if (!resumeText || !jobDescription) {
      alert('请先上传简历和输入岗位描述')
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
        .replace(/{targetIndustry}/g, industry || '互联网')
        .replace(/{targetPosition}/g, position || '工程师')

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      alert('优化简历失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!optimizedResume || !jobDescription) {
      alert('请先优化简历')
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
      alert('生成推荐信失败: ' + error.message)
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">简历大师</h1>
                <p className="text-purple-100">智能简历优化与推荐信生成工具</p>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white font-medium transition-all"
              >
                📋 查看投递记录
              </button>
            </div>
          </div>

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
                上传简历
              </button>
              <button
                onClick={() => setActiveTab('job')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'job'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                岗位描述
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
                优化简历
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
                推荐信
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 投递记录
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">处理中，请稍候...</p>
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
