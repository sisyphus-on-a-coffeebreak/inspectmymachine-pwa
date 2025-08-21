import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
type Theme = "light" | "dark"
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }
const ThemeCtx = createContext<Ctx | null>(null); const KEY = "voms_theme"
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(KEY) as Theme) || "dark")
  useEffect(() => {
    const root = document.documentElement
    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark")
    localStorage.setItem(KEY, theme)
  }, [theme])
  const value = useMemo(() => ({ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }), [theme])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}
export function useTheme(){ const c=useContext(ThemeCtx); if(!c) throw new Error("useTheme inside ThemeProvider"); return c }
