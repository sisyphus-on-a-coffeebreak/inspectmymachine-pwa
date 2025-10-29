const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");
const BASE_URL = (import.meta.env.VITE_API_BASE || `${API_ORIGIN}/api`).replace(/\/$/, "");

export async function apiFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers || {})
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const isJson = options.body && !(options.body instanceof FormData)
  if (isJson && !headers.has("Content-Type")) headers.set("Content-Type","application/json")
  
  const res = await fetch(`${BASE_URL}${path}`, { 
    ...options, 
    headers,
    credentials: "include" // Ensure cookies are sent with requests
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res
}
