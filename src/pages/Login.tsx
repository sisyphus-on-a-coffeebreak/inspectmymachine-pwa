import { useState, type FormEvent } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/providers/AuthProvider"

export default function Login() {
  const { setToken } = useAuth()
  const nav = useNavigate()
  const loc = useLocation() as any
  const [pat, setPat] = useState("")
  const [err, setErr] = useState<string|undefined>()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = pat.trim()
    if (!v) return setErr("Enter a PAT")
    setToken(v)
    const to = loc.state?.from?.pathname || "/"
    nav(to, { replace: true })
  }

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-xl p-6">
        <h1 className="text-lg font-semibold">Sign in (dev)</h1>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Paste Personal Access Token"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button type="submit" className="w-full rounded px-3 py-2 border">Continue</button>
        <p className="text-xs opacity-60">Stored at <code>localStorage.voms_pat</code></p>
      </form>
    </div>
  )
}
