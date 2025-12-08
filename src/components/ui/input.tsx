import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function I({ className, inputMode, ...props }, ref){
  return <input 
    ref={ref} 
    inputMode={inputMode}
    className={cn("h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:bg-zinc-900 dark:border-zinc-700", className)} 
    {...props} 
  />
})
export default Input
