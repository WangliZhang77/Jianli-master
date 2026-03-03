import { useState, useEffect } from 'react'
import { saveApplication } from '../utils/applicationStorage'
import { parseJobDescription } from '../utils/jobDescriptionParser'

function ApplicationRecord({
  companyName,
  position,
  jobDescription,
  resume,
  coverLetter,
  onRecorded,
  onCancel,
  openaiApiKey = '',
}) {
  const [formData, setFormData] = useState({
    companyName: companyName || '',
    position: position || '',
    jobDescription: jobDescription || '',
  })

  const [autoDetected, setAutoDetected] = useState(false)
  const [aiDetecting, setAiDetecting] = useState(false)

  // 当对话框打开时，使用AI自动识别公司名称和职位
  useEffect(() => {
    const detectWithAI = async () => {
      if (jobDescription && (!formData.companyName || !formData.position)) {
        setAiDetecting(true)
        try {
          // 首先尝试使用AI识别
          const response = await fetch('/api/extract-job-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobDescription, apiKey: openaiApiKey.trim() }),
          })

          if (response.ok) {
            const aiResult = await response.json()
            if (aiResult.companyName || aiResult.position) {
              setFormData(prev => ({
                ...prev,
                companyName: prev.companyName || aiResult.companyName || '',
                position: prev.position || aiResult.position || '',
              }))
              setAutoDetected(true)
              setAiDetecting(false)
              return
            }
          }
        } catch (error) {
          console.error('AI识别失败，使用备用方法:', error)
        }

        // 如果AI识别失败，使用正则表达式备用方法
        const parsed = parseJobDescription(jobDescription)
        if (parsed.companyName || parsed.position) {
          setFormData(prev => ({
            ...prev,
            companyName: prev.companyName || parsed.companyName,
            position: prev.position || parsed.position,
          }))
          if (parsed.companyName || parsed.position) {
            setAutoDetected(true)
          }
        }
        setAiDetecting(false)
      }
    }

    detectWithAI()
  }, [jobDescription])

  const handleSave = () => {
    if (!formData.companyName.trim() || !formData.position.trim()) {
      alert('请填写公司名称和职位')
      return
    }

    try {
      saveApplication({
        companyName: formData.companyName.trim(),
        position: formData.position.trim(),
        jobDescription: formData.jobDescription || jobDescription || '',
        resume: resume || '',
        coverLetter: coverLetter || '',
      })
      
      alert('投递记录已保存！')
      onRecorded()
    } catch (error) {
      alert('保存失败: ' + error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">记录投递</h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {aiDetecting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">
                  🤖 AI 正在识别公司名称和职位...
                </p>
              </div>
            </div>
          )}
          {autoDetected && !aiDetecting && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ AI 已自动识别公司名称和职位，请确认或修改
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公司名称 <span className="text-red-500">*</span>
                {autoDetected && formData.companyName && (
                  <span className="ml-2 text-xs text-green-600">(已自动识别)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="请输入公司名称（将自动识别）"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                职位 <span className="text-red-500">*</span>
                {autoDetected && formData.position && (
                  <span className="ml-2 text-xs text-green-600">(已自动识别)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="请输入职位名称（将自动识别）"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                岗位描述（JD）
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="岗位描述会自动填充，也可以手动修改"
                rows="6"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 提示：简历和推荐信内容会自动保存，无需手动输入
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            保存记录
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApplicationRecord
