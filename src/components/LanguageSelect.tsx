import { useEffect, useState } from "react"
import i18n from "@/i18n"

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "hi-Latn", label: "Hindi (Latn)" },
  { value: "or", label: "ଓଡ଼ିଆ" },
  { value: "or-Latn", label: "Odia (Latn)" },
]

export default function LanguageSelect() {
  const [lng, setLng] = useState(i18n.resolvedLanguage || "en")

  useEffect(() => {
    const onChange = () => setLng(i18n.resolvedLanguage || "en")
    i18n.on("languageChanged", onChange)
    return () => i18n.off("languageChanged", onChange)
  }, [])

  return (
    <select
      className="h-9 rounded-md border px-2 text-sm bg-transparent"
      aria-label="Language"
      title="Language"
      value={lng}
      onChange={async (e) => {
        const v = e.target.value
        await i18n.changeLanguage(v)
        localStorage.setItem("voms_lng", v)
      }}
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
