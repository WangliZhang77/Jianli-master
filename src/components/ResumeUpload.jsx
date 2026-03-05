import { useState, useEffect } from 'react'
import { getPrompts as getResumePrompts, getPromptById as getResumePromptById } from '../utils/resumePromptStorage'
import { getPrompts as getCoverLetterPrompts, getPromptById as getCoverLetterPromptById } from '../utils/promptStorage'
import ResumePromptManager from './ResumePromptManager'
import PromptManager from './PromptManager'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'

function ResumeUpload({
  onUpload,
  existingResume = '',
  selectedResumePromptId = 'default',
  onResumePromptChange,
  selectedCoverLetterPromptId = 'default',
  onCoverLetterPromptChange,
  onSyncPromptsToServer,
  promptsSyncedAt = 0,
}) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [text, setText] = useState(existingResume)
  const [showResumePromptManager, setShowResumePromptManager] = useState(false)
  const [showCoverLetterPromptManager, setShowCoverLetterPromptManager] = useState(false)
  const { t } = useI18n()
  const resumePrompts = getResumePrompts()
  const coverLetterPrompts = getCoverLetterPrompts()
  void promptsSyncedAt
  const selectedResumePrompt = getResumePromptById(selectedResumePromptId) || resumePrompts[0]
  const selectedCoverLetterPrompt = getCoverLetterPromptById(selectedCoverLetterPromptId) || coverLetterPrompts[0]

  // 当 existingResume 变化时，更新本地 text 状态
  useEffect(() => {
    if (existingResume) {
      setText(existingResume)
    }
  }, [existingResume])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('selectFileFirst'))
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `上传失败 (${response.status})`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(t('serverNotJson') + ': ' + text.substring(0, 100))
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.text || data.text.trim().length === 0) {
        throw new Error(t('fileEmpty'))
      }

      setText(data.text)
      onUpload(data.text)
    } catch (error) {
      console.error('上传错误详情:', error)
      toast.error(t('uploadFailed') + ': ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleTextSubmit = () => {
    if (text.trim()) {
      onUpload(text)
    } else {
      toast.error(t('enterResumeContent'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">{t('uploadTitle')}</h2>
        <p className="text-slate-300 mb-6">{t('uploadHint')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-200">{t('resumePromptLabel')}</label>
              <AppleButton variant="secondary" onClick={() => setShowResumePromptManager(true)} className="!py-1.5 !px-3 text-sm">
                {t('manage')}
              </AppleButton>
            </div>
            <select
              value={selectedResumePromptId}
              onChange={(e) => onResumePromptChange(e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20"
            >
              {resumePrompts.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
              ))}
            </select>
            {selectedResumePrompt && (
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">{selectedResumePrompt.prompt.substring(0, 80)}…</p>
            )}
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-200">{t('coverLetterPromptLabel')}</label>
              <AppleButton variant="secondary" onClick={() => setShowCoverLetterPromptManager(true)} className="!py-1.5 !px-3 text-sm">
                {t('manage')}
              </AppleButton>
            </div>
            <select
              value={selectedCoverLetterPromptId}
              onChange={(e) => onCoverLetterPromptChange(e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20"
            >
              {coverLetterPrompts.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
              ))}
            </select>
            {selectedCoverLetterPrompt && (
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">{selectedCoverLetterPrompt.prompt.substring(0, 80)}…</p>
            )}
          </div>
        </div>

        {existingResume && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
            <p className="text-sm text-emerald-200">{t('resumeUploadedHint')}</p>
          </div>
        )}
      </div>

      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors">
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-slate-300 font-medium">{file ? file.name : t('clickSelectFile')}</span>
        </label>
        {file && (
          <AppleButton onClick={handleUpload} disabled={uploading} className="mt-4">
            {uploading ? t('uploading') : t('uploadFile')}
          </AppleButton>
        )}
      </div>

      <div className="flex items-center">
        <div className="flex-1 border-t border-white/10" />
        <span className="px-4 text-slate-400">{t('or')}</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">{t('pasteResumeLabel')}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('pasteResumePlaceholder')}
          className="w-full h-64 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20 resize-none"
        />
        <AppleButton onClick={handleTextSubmit} className="mt-4">{t('confirmUse')}</AppleButton>
      </div>

      {showResumePromptManager && (
        <ResumePromptManager
          selectedPromptId={selectedResumePromptId}
          onSelectPrompt={(id) => {
            onResumePromptChange(id)
            setShowResumePromptManager(false)
          }}
          onClose={() => setShowResumePromptManager(false)}
          onAfterSave={onSyncPromptsToServer ? (data) => onSyncPromptsToServer('resume', data) : undefined}
        />
      )}
      {showCoverLetterPromptManager && (
        <PromptManager
          selectedPromptId={selectedCoverLetterPromptId}
          onSelectPrompt={(id) => {
            onCoverLetterPromptChange(id)
            setShowCoverLetterPromptManager(false)
          }}
          onClose={() => setShowCoverLetterPromptManager(false)}
          onAfterSave={onSyncPromptsToServer ? (data) => onSyncPromptsToServer('coverLetter', data) : undefined}
        />
      )}
    </div>
  )
}

export default ResumeUpload
