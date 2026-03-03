import { useState, useEffect } from 'react'
import { getPrompts as getResumePrompts, getPromptById as getResumePromptById } from '../utils/resumePromptStorage'
import { getPrompts as getCoverLetterPrompts, getPromptById as getCoverLetterPromptById } from '../utils/promptStorage'
import ResumePromptManager from './ResumePromptManager'
import PromptManager from './PromptManager'

function ResumeUpload({
  onUpload,
  existingResume = '',
  selectedResumePromptId = 'default',
  onResumePromptChange,
  selectedCoverLetterPromptId = 'default',
  onCoverLetterPromptChange,
}) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [text, setText] = useState(existingResume)
  const [showResumePromptManager, setShowResumePromptManager] = useState(false)
  const [showCoverLetterPromptManager, setShowCoverLetterPromptManager] = useState(false)
  const resumePrompts = getResumePrompts()
  const coverLetterPrompts = getCoverLetterPrompts()
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
      alert('请先选择文件')
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
        throw new Error('服务器返回了非 JSON 响应: ' + text.substring(0, 100))
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('文件解析后内容为空，请检查文件格式')
      }

      setText(data.text)
      onUpload(data.text)
    } catch (error) {
      console.error('上传错误详情:', error)
      alert('上传失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleTextSubmit = () => {
    if (text.trim()) {
      onUpload(text)
    } else {
      alert('请输入简历内容')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">上传简历</h2>
        <p className="text-gray-600 mb-6">
          支持上传 PDF 或 Word 文档，或直接粘贴简历文本
        </p>

        {/* 首页选择：简历优化 + 推荐信 提示词 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">简历优化提示词</label>
              <button
                type="button"
                onClick={() => setShowResumePromptManager(true)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                管理
              </button>
            </div>
            <select
              value={selectedResumePromptId}
              onChange={(e) => onResumePromptChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {resumePrompts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedResumePrompt && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">{selectedResumePrompt.prompt.substring(0, 80)}…</p>
            )}
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">推荐信提示词</label>
              <button
                type="button"
                onClick={() => setShowCoverLetterPromptManager(true)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                管理
              </button>
            </div>
            <select
              value={selectedCoverLetterPromptId}
              onChange={(e) => onCoverLetterPromptChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {coverLetterPrompts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedCoverLetterPrompt && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">{selectedCoverLetterPrompt.prompt.substring(0, 80)}…</p>
            )}
          </div>
        </div>

        {existingResume && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ 简历已上传，您可以重新上传或修改下方内容
            </p>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-gray-600 font-medium">
            {file ? file.name : '点击选择文件 (PDF/Word)'}
          </span>
        </label>
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {uploading ? '上传中...' : '上传文件'}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500">或</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          直接粘贴简历内容
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请粘贴您的简历内容..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <button
          onClick={handleTextSubmit}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          确认使用
        </button>
      </div>

      {showResumePromptManager && (
        <ResumePromptManager
          selectedPromptId={selectedResumePromptId}
          onSelectPrompt={(id) => {
            onResumePromptChange(id)
            setShowResumePromptManager(false)
          }}
          onClose={() => setShowResumePromptManager(false)}
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
        />
      )}
    </div>
  )
}

export default ResumeUpload
