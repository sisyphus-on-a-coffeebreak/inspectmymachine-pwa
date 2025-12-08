import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string // Required for accessibility
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "destructive"
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = "md", variant = "default", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-11 h-11", // 44px minimum for touch targets
      md: "w-12 h-12", // 48px
      lg: "w-14 h-14", // 56px
    }

    const variantClasses = {
      default: "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
      ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
      destructive: "bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20",
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </button>
    )
  }
)

IconButton.displayName = "IconButton"

