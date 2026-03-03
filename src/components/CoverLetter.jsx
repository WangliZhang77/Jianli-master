import { useState } from 'react'
import ApplicationRecord from './ApplicationRecord'
import { exportCoverLetterToDocxFormatted } from '../utils/docxExporter'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'

function CoverLetter({
  coverLetter,
  companyName,
  position,
  jobDescription,
  resume,
  onNextApplication,
  openaiApiKey = '',
}) {
  const { t, locale } = useI18n()
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter)
    toast.success(t('copied'))
  }

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = locale === 'en' ? 'cover-letter.txt' : '推荐信.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportDocx = async () => {
    if (!coverLetter) {
      alert(t('noContentToExport'))
      return
    }

    setExporting(true)
    try {
      await exportCoverLetterToDocxFormatted(coverLetter, companyName, position)
      // 不显示alert，因为文件已经开始下载
    } catch (error) {
      toast.error(t('exportFailed') + ': ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleRecorded = () => {
    setShowRecordDialog(false)
  }

  const handleNextApplication = () => {
    if (onNextApplication) {
      onNextApplication()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-white">{t('coverLetter')}</h2>
        <div className="flex flex-wrap gap-2">
          <AppleButton variant="secondary" onClick={handleCopy}>{t('copy')}</AppleButton>
          <AppleButton variant="secondary" onClick={handleDownload}>{t('downloadTxt')}</AppleButton>
          <AppleButton onClick={handleExportDocx} disabled={exporting} className={exporting ? 'opacity-50' : ''}>
            {exporting ? t('exporting') : `📄 ${t('exportDocx')}`}
          </AppleButton>
          <AppleButton onClick={() => setShowRecordDialog(true)} className="!bg-emerald-500/90 text-white hover:!bg-emerald-500">
            {t('recordDelivery')}
          </AppleButton>
          <AppleButton onClick={handleNextApplication} className="!bg-orange-500/90 text-white hover:!bg-orange-500">
            🚀 {t('nextApplication')}
          </AppleButton>
        </div>
      </div>

      {showRecordDialog && (
        <ApplicationRecord
          companyName={companyName}
          position={position}
          jobDescription={jobDescription}
          resume={resume}
          coverLetter={coverLetter}
          onRecorded={handleRecorded}
          onCancel={() => setShowRecordDialog(false)}
          openaiApiKey={openaiApiKey}
        />
      )}

      <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
        <div className="px-4 py-2 border-b border-white/10 bg-white/5">
          <h3 className="font-medium text-slate-200">{t('coverLetterContent')}</h3>
        </div>
        <div className="p-6 min-h-96">
          <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">{coverLetter}</pre>
        </div>
      </div>
    </div>
  )
}

export default CoverLetter
