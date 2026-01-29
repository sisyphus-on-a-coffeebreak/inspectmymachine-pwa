import { forwardRef, type InputHTMLAttributes } from "react"
import { formStyles, borderRadius, colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function I({ className, inputMode, ...props }, ref){
  return <input 
    ref={ref} 
    inputMode={inputMode}
    className={className}
    style={{
      ...formStyles.input,
      fontSize: '16px', // Minimum 16px to prevent iOS zoom on input focus
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.white,
      borderColor: colors.neutral[300],
      color: colors.neutral[700],
      ...props.style
    }}
    {...props} 
  />
})
export default Input
