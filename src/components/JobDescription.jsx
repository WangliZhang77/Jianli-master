import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/resumePromptStorage'
import ResumePromptManager from './ResumePromptManager'
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('jobDescTitle')}</h2>
        <p className="text-gray-600 mb-6">
          {t('jobDescHint')}
        </p>
        {hasResume ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              {t('resumeReady', { n: resumeText.length })}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {t('uploadResumeFirstHint')}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('resumePromptTemplate')}
          </label>
          <button
            onClick={() => setShowPromptManager(true)}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t('managePrompts')}
          </button>
        </div>
        <select
          value={selectedResumePromptId}
          onChange={(e) => onResumePromptChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </select>
        {selectedPrompt && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{t('templatePreview')}</p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {selectedPrompt.prompt.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('companyAndJobLabel')}
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t('jobDescExample')}
          className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onFullFlow}
          disabled={!hasResume || !jobDescription.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
        >
          {t('oneClickGenerate')}
        </button>
        <button
          onClick={onOptimize}
          disabled={!hasResume || !jobDescription.trim()}
          className="w-full px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          {t('optimizeOnly')}
        </button>
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
