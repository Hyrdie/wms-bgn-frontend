/** API server origin without `/api/v1` (for static uploads, etc.). */
export function apiPublicOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  return base.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8000'
}
