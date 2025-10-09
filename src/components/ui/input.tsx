import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function I({ className, ...props }, ref){
  return <input ref={ref} className={cn("h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:bg-zinc-900 dark:border-zinc-700", className)} {...props} />
})
export default Input
