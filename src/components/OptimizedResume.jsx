import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/promptStorage'
import PromptManager from './PromptManager'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'
import { exportResumeToDocxFormatted } from '../utils/docxExporter'

function OptimizedResume({
  originalResume,
  optimizedResume,
  companyName = '',
  position = '',
  onGenerateCoverLetter,
  selectedCoverLetterPromptId = 'default',
  onCoverLetterPromptChange,
  onAfterSaveCoverLetterPrompts,
}) {
  const [showPromptManager, setShowPromptManager] = useState(false)
  const [viewMode, setViewMode] = useState('compare') // 'compare' | 'optimizedOnly'
  const [exportingResume, setExportingResume] = useState(false)
  const { t, locale } = useI18n()
  const prompts = getPrompts()
  const selectedPrompt = getPromptById(selectedCoverLetterPromptId) || prompts[0]

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success(t('copied'))
  }

  const handleExportResumeDocx = async () => {
    if (!optimizedResume) return
    setExportingResume(true)
    try {
      await exportResumeToDocxFormatted(optimizedResume, companyName, position)
      toast.success(locale === 'en' ? 'Resume exported' : '简历已导出')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExportingResume(false)
    }
  }

  const handleDownloadResumeTxt = () => {
    if (!optimizedResume) return
    const blob = new Blob([optimizedResume], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = locale === 'en' ? 'resume-optimized.txt' : '优化简历.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(locale === 'en' ? 'Downloaded' : '已下载')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">{t('optimizedResumeTitle')}</h2>
        <div className="flex flex-wrap gap-2">
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
          onAfterSave={onAfterSaveCoverLetterPrompts}
        />
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={() => setViewMode('compare')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'compare' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
        >
          {t('viewCompare')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('optimizedOnly')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'optimizedOnly' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
        >
          {t('viewOptimizedOnly')}
        </button>
      </div>

      <div className={`grid gap-6 ${viewMode === 'compare' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {viewMode === 'compare' && (
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
        )}
        <div className={`border rounded-xl overflow-hidden bg-white/5 ${viewMode === 'compare' ? 'border-white/15' : 'border-white/10'}`}>
          <div className="px-4 py-2 border-b border-white/10 flex flex-wrap justify-between items-center gap-2 bg-white/5">
            <h3 className="font-medium text-slate-200">{t('optimizedResumeLabel')}</h3>
            <div className="flex flex-wrap gap-2">
              <AppleButton variant="secondary" onClick={() => handleCopy(optimizedResume)} className="!py-1 !px-3 text-sm">
                {t('copy')}
              </AppleButton>
              <AppleButton variant="secondary" onClick={handleDownloadResumeTxt} className="!py-1 !px-3 text-sm">
                {t('downloadTxt')}
              </AppleButton>
              <AppleButton
                onClick={handleExportResumeDocx}
                disabled={exportingResume}
                className="!py-1 !px-3 text-sm"
              >
                {exportingResume ? t('exporting') : t('exportResumeDocx')}
              </AppleButton>
            </div>
          </div>
          <div className={`p-4 overflow-y-auto ${viewMode === 'compare' ? 'h-96' : 'min-h-[24rem]'}`}>
            <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">{optimizedResume}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizedResume
