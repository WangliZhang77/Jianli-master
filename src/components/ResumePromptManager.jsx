import { useState, useEffect } from 'react'
import { getPrompts, savePrompt, deletePrompt, resetToDefaultPrompts } from '../utils/resumePromptStorage'
import AppleButton from './AppleButton'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'

function ResumePromptManager({ selectedPromptId, onSelectPrompt, onClose, onAfterSave }) {
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
      onAfterSave?.(getPrompts())
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
      onAfterSave?.(getPrompts())
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

  const handleResetToDefault = () => {
    if (!confirm(t('confirmResetPromptsToDefault'))) return
    try {
      resetToDefaultPrompts()
      loadPrompts()
      toast.success(t('resetPromptsSuccess'))
      onAfterSave?.(getPrompts())
    } catch (error) {
      toast.error(t('saveFailedShort') + ': ' + error.message)
    }
  }

  const defaultForm = { name: '', prompt: '', systemPrompt: '你是一位专业的简历优化专家，擅长根据岗位要求优化简历内容。' }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t('resumePromptManageTitle')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {showAddForm && (
            <div className="mb-6 p-4 border border-white/10 rounded-xl bg-white/5">
              <h3 className="font-bold text-white mb-4">{editingPrompt ? t('editTemplate') : t('newTemplate')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">{t('templateName')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('promptNamePlaceholder')}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">{t('systemPromptOptional')}</label>
                  <input
                    type="text"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder={t('systemRolePlaceholder')}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    {t('promptContentLabel')}
                    <span className="text-xs text-slate-400 ml-2">（{'{jobDescription}'}、{'{resume}'}、{'{targetIndustry}'}、{'{targetPosition}'}）</span>
                  </label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder={t('promptContentPlaceholder')}
                    rows={10}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:ring-2 focus:ring-white/20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <AppleButton onClick={handleSave}>{t('save')}</AppleButton>
                  <AppleButton variant="secondary" onClick={() => { setShowAddForm(false); setEditingPrompt(null); setFormData(defaultForm) }}>{t('cancel')}</AppleButton>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-white">{t('savedTemplates')}</h3>
              {!showAddForm && (
                <div className="flex gap-2">
                  <AppleButton variant="secondary" onClick={handleResetToDefault} className="!py-2 text-sm">{t('resetPromptsToDefault')}</AppleButton>
                  <AppleButton onClick={() => { setShowAddForm(true); setEditingPrompt(null) }} className="!py-2 text-sm">{t('addNewTemplate')}</AppleButton>
                </div>
              )}
            </div>
            {prompts.map((prompt) => (
              <div key={prompt.id} className={`p-4 border rounded-xl ${selectedPromptId === prompt.id ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{prompt.name}</h4>
                      {selectedPromptId === prompt.id && <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-lg">{t('currentUse')}</span>}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{prompt.prompt.substring(0, 100)}...</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <AppleButton onClick={() => onSelectPrompt(prompt.id)} className="!py-1.5 !px-3 text-sm">{t('useTemplate')}</AppleButton>
                    {prompt.id !== 'default' && (
                      <>
                        <AppleButton variant="secondary" onClick={() => handleEdit(prompt)} className="!py-1.5 !px-3 text-sm">{t('edit')}</AppleButton>
                        <AppleButton variant="secondary" onClick={() => handleDelete(prompt.id)} className="!py-1.5 !px-3 text-sm !bg-red-500/20 !text-red-200 !border-red-400/30">{t('delete')}</AppleButton>
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
