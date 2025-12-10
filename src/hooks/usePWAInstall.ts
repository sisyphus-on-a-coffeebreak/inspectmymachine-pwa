import { useState, useEffect, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface PWAInstallState {
  canInstall: boolean
  isInstalled: boolean
  isIOS: boolean
  promptInstall: () => Promise<boolean>
  dismissPrompt: () => void
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Detect iOS
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

  // Check if already installed
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    setIsInstalled(isStandalone || localStorage.getItem("voms_pwa_installed") === "true")

    // Listen for install state changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
        localStorage.setItem("voms_pwa_installed", "true")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Track successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      localStorage.setItem("voms_pwa_installed", "true")
      // Analytics: track install
      // App installed successfully - tracked via localStorage
    })

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    // Track prompt dismissal
    if (outcome === "dismissed") {
      localStorage.setItem("voms_pwa_prompt_dismissed", Date.now().toString())
      // Track dismissal count
      const dismissCount = parseInt(localStorage.getItem("voms_pwa_dismiss_count") || "0") + 1
      localStorage.setItem("voms_pwa_dismiss_count", dismissCount.toString())
    }

    if (outcome === "accepted") {
      setIsInstalled(true)
      localStorage.setItem("voms_pwa_installed", "true")
    }

    setDeferredPrompt(null)
    return outcome === "accepted"
  }, [deferredPrompt])

  const dismissPrompt = useCallback(() => {
    localStorage.setItem("voms_pwa_install_dismissed", Date.now().toString())
  }, [])

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt,
  }
}

