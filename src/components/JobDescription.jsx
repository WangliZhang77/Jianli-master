import { useState } from 'react'
import { getPrompts, getPromptById } from '../utils/resumePromptStorage'
import ResumePromptManager from './ResumePromptManager'

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
  const prompts = getPrompts()
  const selectedPrompt = getPromptById(selectedResumePromptId) || prompts[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">岗位描述</h2>
        <p className="text-gray-600 mb-6">
          请输入您想要投递的公司和岗位的详细描述，包括岗位要求、职责等
        </p>
        {hasResume ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ 简历已准备就绪（{resumeText.length} 字符），可以开始优化
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠ 请先在上传简历页面上传您的简历
            </p>
          </div>
        )}
      </div>

      {/* 简历优化提示词选择 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            简历优化提示词模板
          </label>
          <button
            onClick={() => setShowPromptManager(true)}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            管理提示词
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
            <p className="text-xs text-gray-500 mb-1">模板预览：</p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {selectedPrompt.prompt.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          公司名称和岗位描述
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="例如：&#10;公司：XX科技有限公司&#10;岗位：高级前端开发工程师&#10;&#10;岗位要求：&#10;1. 3年以上前端开发经验&#10;2. 熟练掌握React、Vue等框架&#10;3. 有良好的代码规范和团队协作能力&#10;..."
          className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onFullFlow}
          disabled={!hasResume || !jobDescription.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
        >
          一键生成（优化简历 + 推荐信）
        </button>
        <button
          onClick={onOptimize}
          disabled={!hasResume || !jobDescription.trim()}
          className="w-full px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          仅优化简历
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
