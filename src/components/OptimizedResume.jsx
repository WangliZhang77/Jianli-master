import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/promptStorage'
import PromptManager from './PromptManager'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'

function OptimizedResume({
  originalResume,
  optimizedResume,
  onGenerateCoverLetter,
  selectedCoverLetterPromptId = 'default',
  onCoverLetterPromptChange,
}) {
  const [showPromptManager, setShowPromptManager] = useState(false)
  const { t } = useI18n()
  const prompts = getPrompts()
  const selectedPrompt = getPromptById(selectedCoverLetterPromptId) || prompts[0]

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success(t('copied'))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">{t('optimizedResumeTitle')}</h2>
        <div className="flex gap-2">
          <AppleButton variant="secondary" onClick={() => setShowPromptManager(true)} className="!py-2 text-sm">
            {t('manageCoverLetterPrompts')}
          </AppleButton>
          <AppleButton onClick={onGenerateCoverLetter}>{t('generateCoverLetter')}</AppleButton>
        </div>
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-200 mb-2">{t('coverLetterPromptTemplate')}</label>
            <select
              value={selectedCoverLetterPromptId}
              onChange={(e) => onCoverLetterPromptChange(e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-white/20"
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id} className="bg-slate-800">{prompt.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedPrompt && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-slate-400 mb-1">{t('templatePreview')}</p>
            <p className="text-sm text-slate-300 line-clamp-2">{selectedPrompt.prompt.substring(0, 150)}...</p>
          </div>
        )}
      </div>

      {showPromptManager && (
        <PromptManager
          selectedPromptId={selectedCoverLetterPromptId}
          onSelectPrompt={(id) => {
            onCoverLetterPromptChange(id)
            setShowPromptManager(false)
          }}
          onClose={() => setShowPromptManager(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
          <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-medium text-slate-200">{t('originalResume')}</h3>
            <AppleButton variant="secondary" onClick={() => handleCopy(originalResume)} className="!py-1 !px-3 text-sm">
              {t('copy')}
            </AppleButton>
          </div>
          <div className="p-4 h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">{originalResume}</pre>
          </div>
        </div>
        <div className="border border-white/15 rounded-xl overflow-hidden bg-white/5">
          <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-medium text-slate-200">{t('optimizedResumeLabel')}</h3>
            <AppleButton variant="secondary" onClick={() => handleCopy(optimizedResume)} className="!py-1 !px-3 text-sm">
              {t('copy')}
            </AppleButton>
          </div>
          <div className="p-4 h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">{optimizedResume}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizedResume
