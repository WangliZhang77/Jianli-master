const STORAGE_KEY = 'app_lang'

const messages = {
  zh: {
    appTitle: '简历大师',
    appSubtitle: '智能简历优化与推荐信生成工具',
    setApiKey: '设置 API Key',
    apiKeySet: '已设置 API Key',
    viewHistory: '查看投递记录',
    tabUpload: '上传简历',
    tabJob: '岗位描述',
    tabResume: '优化简历',
    tabCoverLetter: '推荐信',
    tabHistory: '投递记录',
    coverLetter: '推荐信',
    coverLetterEn: 'Cover Letter',
    apiKeyModalTitle: 'OpenAI API Key',
    apiKeyModalHint: '密钥仅保存在本机浏览器，不会上传到服务器。用于调用简历优化与推荐信生成。',
    cancel: '取消',
    save: '保存',
    copy: '复制',
    downloadTxt: '下载 TXT',
    exportDocx: '导出 DOCX',
    exporting: '导出中...',
    recordDelivery: '记录投递',
    nextApplication: '投递下一份',
    coverLetterContent: '生成的推荐信内容',
    coverLetterContentEn: 'Generated Cover Letter',
    noContentToExport: '没有推荐信内容可导出',
    noContentToExportEn: 'No cover letter content to export',
    copied: '已复制到剪贴板',
    copiedEn: 'Copied to clipboard',
    apiKeySaved: 'API Key 已保存',
    apiKeySavedEn: 'API Key saved',
    loading: '处理中，请稍候...',
    loadingEn: 'Processing...',
  },
  en: {
    appTitle: 'Resume Master',
    appSubtitle: 'Smart resume optimization & cover letter generator',
    setApiKey: 'Set API Key',
    apiKeySet: 'API Key Set',
    viewHistory: 'View History',
    tabUpload: 'Upload Resume',
    tabJob: 'Job Description',
    tabResume: 'Optimize Resume',
    tabCoverLetter: 'Cover Letter',
    tabHistory: 'History',
    coverLetter: 'Cover Letter',
    coverLetterEn: 'Cover Letter',
    apiKeyModalTitle: 'OpenAI API Key',
    apiKeyModalHint: 'Key is stored only in your browser. Used for resume optimization and cover letter generation.',
    cancel: 'Cancel',
    save: 'Save',
    copy: 'Copy',
    downloadTxt: 'Download TXT',
    exportDocx: 'Export DOCX',
    exporting: 'Exporting...',
    recordDelivery: 'Record Application',
    nextApplication: 'Next Application',
    coverLetterContent: 'Generated Cover Letter',
    coverLetterContentEn: 'Generated Cover Letter',
    noContentToExport: 'No cover letter content to export',
    noContentToExportEn: 'No cover letter content to export',
    copied: 'Copied to clipboard',
    copiedEn: 'Copied to clipboard',
    apiKeySaved: 'API Key saved',
    apiKeySavedEn: 'API Key saved',
    loading: 'Processing...',
    loadingEn: 'Processing...',
  },
}

export function getLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'zh') return stored
  } catch (e) {}
  return 'zh'
}

export function setLocale(lang) {
  try {
    if (lang === 'en' || lang === 'zh') localStorage.setItem(STORAGE_KEY, lang)
  } catch (e) {}
}

export function t(locale, key) {
  const m = messages[locale] || messages.zh
  return m[key] ?? key
}

export { messages }
