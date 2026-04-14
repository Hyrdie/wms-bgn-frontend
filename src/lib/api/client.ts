import { ngrokSkipBrowserWarningHeaders } from './ngrok'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

function buildHeaders(includeJsonContentType: boolean) {
  const token = localStorage.getItem('wms_access_token')
  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...ngrokSkipBrowserWarningHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    // Do not set Content-Type on GET — it triggers stricter CORS preflights and is unnecessary.
    headers: buildHeaders(false),
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function apiPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<TResponse>
}

export async function apiPut<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<TResponse>
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
}
