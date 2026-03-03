import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/resumePromptStorage'
import ResumePromptManager from './ResumePromptManager'
import AppleButton from './AppleButton'
import { useI18n } from '../contexts/I18nContext'

function JobDescription({
  jobDescription,
  setJobDescription,
  onFullFlow,
  onOptimize,
  hasResume,
  resumeText,
  selectedResumePromptId = 'default',
  onResumePromptChange,
}) {
  const [showPromptManager, setShowPromptManager] = useState(false)
  const { t } = useI18n()
  const prompts = getPrompts()
  const selectedPrompt = getPromptById(selectedResumePromptId) || prompts[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">{t('jobDescTitle')}</h2>
        <p className="text-slate-300 mb-6">{t('jobDescHint')}</p>
        {hasResume ? (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
            <p className="text-sm text-emerald-200">{t('resumeReady', { n: resumeText.length })}</p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl">
            <p className="text-sm text-amber-200">{t('uploadResumeFirstHint')}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-200">{t('resumePromptTemplate')}</label>
          <AppleButton variant="secondary" onClick={() => setShowPromptManager(true)} className="!py-1.5 !px-3 text-sm">
            {t('managePrompts')}
          </AppleButton>
        </div>
        <select
          value={selectedResumePromptId}
          onChange={(e) => onResumePromptChange(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20"
        >
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id} className="bg-slate-800">{prompt.name}</option>
          ))}
        </select>
        {selectedPrompt && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-400 mb-1">{t('templatePreview')}</p>
            <p className="text-sm text-slate-300 line-clamp-2">{selectedPrompt.prompt.substring(0, 150)}...</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">{t('companyAndJobLabel')}</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t('jobDescExample')}
          className="w-full h-80 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20 resize-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <AppleButton onClick={onFullFlow} disabled={!hasResume || !jobDescription.trim()} className="w-full !py-3 text-lg">
          {t('oneClickGenerate')}
        </AppleButton>
        <AppleButton variant="secondary" onClick={onOptimize} disabled={!hasResume || !jobDescription.trim()} className="w-full">
          {t('optimizeOnly')}
        </AppleButton>
      </div>

      {showPromptManager && (
        <ResumePromptManager
          selectedPromptId={selectedResumePromptId}
          onSelectPrompt={(id) => {
            onResumePromptChange(id)
            setShowPromptManager(false)
          }}
          onClose={() => setShowPromptManager(false)}
        />
      )}
    </div>
  )
}

export default JobDescription
