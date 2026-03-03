import { useState, useEffect } from 'react'
import { getPrompts, savePrompt, deletePrompt } from '../utils/resumePromptStorage'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'

function ResumePromptManager({ selectedPromptId, onSelectPrompt, onClose }) {
  const { t } = useI18n()
  const [prompts, setPrompts] = useState([])
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    systemPrompt: '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
  })

  const loadPrompts = () => {
    setPrompts(getPrompts())
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleSave = () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast.error(t('fillPromptNameAndContent'))
      return
    }

    try {
      const prompt = {
        ...formData,
        id: editingPrompt?.id || Date.now().toString()
      }
      savePrompt(prompt)
      loadPrompts()
      setEditingPrompt(null)
      setShowAddForm(false)
      setFormData({
        name: '',
        prompt: '',
        systemPrompt: '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
      })
    } catch (error) {
      toast.error(t('saveFailedShort') + ': ' + error.message)
    }
  }

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteTemplate'))) {
      return
    }

    try {
      deletePrompt(id)
      loadPrompts()
      if (selectedPromptId === id) {
        onSelectPrompt('default')
      }
    } catch (error) {
      toast.error(t('deleteFailedShort') + ': ' + error.message)
    }
  }

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      prompt: prompt.prompt,
      systemPrompt: prompt.systemPrompt || '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
    })
    setShowAddForm(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('resumePromptManageTitle')}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
              <h3 className="font-bold text-gray-800 mb-4">
                {editingPrompt ? t('editTemplate') : t('newTemplate')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('templateName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('promptNamePlaceholder')}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('systemPromptOptional')}
                  </label>
                  <input
                    type="text"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder={t('systemRolePlaceholder')}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('promptContentLabel')}
                    <span className="text-xs text-gray-500 ml-2">
                      （{'{jobDescription}'}、{'{resume}'}、{'{targetIndustry}'}、{'{targetPosition}'}）
                    </span>
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder={t('promptContentPlaceholder')}
                    rows="10"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t('save')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingPrompt(null)
                      setFormData({
                        name: '',
                        prompt: '',
                        systemPrompt: '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。'
                      })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{t('savedTemplates')}</h3>
              {!showAddForm && (
                <button
                  onClick={() => {
                    setShowAddForm(true)
                    setEditingPrompt(null)
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  {t('addNewTemplate')}
                </button>
              )}
            </div>

            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`p-4 border rounded-lg ${
                  selectedPromptId === prompt.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-800">{prompt.name}</h4>
                      {selectedPromptId === prompt.id && (
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                          当前使用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {prompt.prompt.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onSelectPrompt(prompt.id)}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      {t('useTemplate')}
                    </button>
                    {prompt.id !== 'default' && (
                      <>
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          {t('delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePromptManager
