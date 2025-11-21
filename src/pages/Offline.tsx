import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          You're offline
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Check your internet connection and try again. Some features may still work offline.
        </p>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw size={18} />
          Try Again
        </Button>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-400 mb-3">Available offline:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
              View saved inspections
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
              Draft gate passes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

