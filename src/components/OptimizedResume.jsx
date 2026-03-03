import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/promptStorage'
import PromptManager from './PromptManager'
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
    alert(t('copied'))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('optimizedResumeTitle')}</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPromptManager(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            {t('manageCoverLetterPrompts')}
          </button>
          <button
            onClick={onGenerateCoverLetter}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
          >
            {t('generateCoverLetter')}
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('coverLetterPromptTemplate')}
            </label>
            <select
              value={selectedCoverLetterPromptId}
              onChange={(e) => onCoverLetterPromptChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedPrompt && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{t('templatePreview')}</p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {selectedPrompt.prompt.substring(0, 150)}...
            </p>
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
        {/* Original Resume */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
            <h3 className="font-medium text-gray-700">{t('originalResume')}</h3>
            <button
              onClick={() => handleCopy(originalResume)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t('copy')}
            </button>
          </div>
          <div className="p-4 h-96 overflow-y-auto bg-white">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {originalResume}
            </pre>
          </div>
        </div>

        {/* Optimized Resume */}
        <div className="border border-purple-300 rounded-lg overflow-hidden">
          <div className="bg-purple-100 px-4 py-2 border-b border-purple-300 flex justify-between items-center">
            <h3 className="font-medium text-purple-700">{t('optimizedResumeLabel')}</h3>
            <button
              onClick={() => handleCopy(optimizedResume)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t('copy')}
            </button>
          </div>
          <div className="p-4 h-96 overflow-y-auto bg-white">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {optimizedResume}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizedResume
