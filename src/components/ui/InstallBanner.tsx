import { useState, useEffect } from "react"
import { X, Download, Share } from "lucide-react"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Button } from "./button"
import { zIndex } from "@/lib/z-index"

// Detect browser type
function detectBrowser(): 'chrome' | 'firefox' | 'samsung' | 'safari' | 'ios' | 'other' {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/samsungbrowser/.test(ua)) return 'samsung'
  if (/firefox/.test(ua)) return 'firefox'
  if (/chrome/.test(ua) && !/edg/.test(ua)) return 'chrome'
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari'
  return 'other'
}

// Get install instructions for each browser
function getInstallInstructions(browser: string): string {
  switch (browser) {
    case 'ios':
      return "Tap the Share button (square with arrow) at the bottom, then select 'Add to Home Screen'"
    case 'firefox':
      return "Tap the menu (three lines) → Install or Add to Home Screen"
    case 'samsung':
      return "Tap the menu (three lines) → Add page to → Home screen"
    case 'safari':
      return "Tap the Share button, then 'Add to Home Screen'"
    default:
      return "Use your browser's menu to install this app"
  }
}

export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall, dismissPrompt } = usePWAInstall()
  const [show, setShow] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const browser = detectBrowser()

  useEffect(() => {
    // Show banner after 30 seconds or on 2nd+ visit
    const visits = parseInt(localStorage.getItem("voms_visit_count") || "0") + 1
    localStorage.setItem("voms_visit_count", visits.toString())

    const dismissed = localStorage.getItem("voms_pwa_install_dismissed")
    const dismissedRecently =
      dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000 // 7 days

    if (!isInstalled && !dismissedRecently && (canInstall || isIOS || browser === 'firefox' || browser === 'samsung')) {
      const timer = setTimeout(() => setShow(true), visits > 1 ? 5000 : 30000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, isIOS, browser])

  if (!show || isInstalled) return null

  const handleInstall = async () => {
    if (canInstall && (browser === 'chrome' || browser === 'other')) {
      await promptInstall()
      setShow(false)
    } else {
      // Show instructions for browsers without native prompt
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    dismissPrompt()
    setShow(false)
  }

  if (showInstructions) {
    return (
      <div
        className="fixed left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 animate-slide-up"
        style={{
          bottom: 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))',
          zIndex: zIndex.installBanner,
        }}
      >
        <button
          onClick={() => {
            setShowInstructions(false)
            setShow(false)
          }}
          className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-600"
          aria-label="Close instructions"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Install VOMS</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {getInstallInstructions(browser)}
          </p>
          <Button 
            onClick={() => {
              setShowInstructions(false)
              setShow(false)
            }} 
            className="w-full" 
            size="sm"
          >
            Got it
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 animate-slide-up"
      style={{
        bottom: 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))', // Bottom nav (64px) + gap (16px) + safe area
        zIndex: zIndex.installBanner, // 9650 - Above modals but below toasts
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-600"
        aria-label="Dismiss install banner"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <img src="/pwa-192x192.png" alt="VOMS" className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Install VOMS</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isIOS
              ? "Add to home screen for quick access"
              : "Install for offline access and faster loading"}
          </p>
        </div>
      </div>

      <Button onClick={handleInstall} className="w-full mt-3" size="sm">
        {isIOS ? <Share size={16} className="mr-2" /> : <Download size={16} className="mr-2" />}
        {isIOS ? "How to Install" : "Install App"}
      </Button>
    </div>
  )
}

