import { useState, useEffect } from 'react'
import ApplicationRecord from './ApplicationRecord'
import { exportCoverLetterToDocxFormatted } from '../utils/docxExporter'

function CoverLetter({ 
  coverLetter, 
  companyName, 
  position, 
  jobDescription, 
  resume,
  onNextApplication
}) {
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasShownRecordDialog, setHasShownRecordDialog] = useState(false)

  // 当推荐信生成后，自动弹出记录窗口
  useEffect(() => {
    if (coverLetter && !hasShownRecordDialog) {
      // 延迟一点时间，让用户先看到推荐信
      const timer = setTimeout(() => {
        setShowRecordDialog(true)
        setHasShownRecordDialog(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [coverLetter, hasShownRecordDialog])

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter)
    alert('已复制到剪贴板')
  }

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '推荐信.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportDocx = async () => {
    if (!coverLetter) {
      alert('没有推荐信内容可导出')
      return
    }

    setExporting(true)
    try {
      await exportCoverLetterToDocxFormatted(coverLetter, companyName, position)
      // 不显示alert，因为文件已经开始下载
    } catch (error) {
      alert('导出失败: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleRecorded = () => {
    setShowRecordDialog(false)
    // 不再自动询问是否投递下一份，用户可以通过"投递下一份"按钮手动操作
  }

  const handleNextApplication = () => {
    if (onNextApplication) {
      const shouldContinue = confirm(
        '确定要投递下一份简历吗？\n\n点击"确定"将清空当前流程，重新开始。\n点击"取消"保留当前内容。'
      )
      
      if (shouldContinue) {
        onNextApplication()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">推荐信</h2>
        <div className="space-x-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            复制
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            下载 TXT
          </button>
          <button
            onClick={handleExportDocx}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? '导出中...' : '📄 导出 DOCX'}
          </button>
          <button
            onClick={() => setShowRecordDialog(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            记录投递
          </button>
          <button
            onClick={handleNextApplication}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🚀 投递下一份
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
        />
      )}

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 border-b border-gray-300">
          <h3 className="font-medium text-gray-700">生成的推荐信内容</h3>
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
