import type { ReactNode } from "react"
import ThemeToggle from "@/components/ThemeToggle"
import LanguageSelect from "@/components/LanguageSelect"
import { useTranslation } from "react-i18next"

export default function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">{t("title")}</div>
          <div className="flex items-center gap-2">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  )
}
