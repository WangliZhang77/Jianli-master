const STORAGE_KEY = 'openai_api_key'

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch (_e) {
    return ''
  }
}

export function setApiKey(key) {
  try {
    const v = (key && key.trim()) || ''
    if (v) localStorage.setItem(STORAGE_KEY, v)
    else localStorage.removeItem(STORAGE_KEY)
  } catch (_e) {}
}

export function hasApiKey() {
  return !!getApiKey().trim()
}
