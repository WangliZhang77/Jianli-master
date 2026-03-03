import { useState } from 'react'
import ApplicationRecord from './ApplicationRecord'
import { exportCoverLetterToDocxFormatted } from '../utils/docxExporter'
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('coverLetter')}</h2>
        <div className="space-x-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t('copy')}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {t('downloadTxt')}
          </button>
          <button
            onClick={handleExportDocx}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? t('exporting') : `📄 ${t('exportDocx')}`}
          </button>
          <button
            onClick={() => setShowRecordDialog(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('recordDelivery')}
          </button>
          <button
            onClick={handleNextApplication}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🚀 {t('nextApplication')}
          </button>
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

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 border-b border-gray-300">
          <h3 className="font-medium text-gray-700">{t('coverLetterContent')}</h3>
        </div>
        <div className="p-6 bg-white min-h-96">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {coverLetter}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default CoverLetter
