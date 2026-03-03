/**
 * API base URL for requests. Empty string = same origin (default).
 * Set VITE_API_BASE_URL in .env.production when frontend is deployed separately (e.g. Vercel + Railway backend).
 */
export function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || ''
}
