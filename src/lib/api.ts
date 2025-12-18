import { getApiUrl } from './apiConfig';

export async function apiFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers || {})
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const isJson = options.body && !(options.body instanceof FormData)
  if (isJson && !headers.has("Content-Type")) headers.set("Content-Type","application/json")
  
  const res = await fetch(getApiUrl(path), { 
    ...options, 
    headers,
    credentials: "include" // Ensure cookies are sent with requests
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res
}
