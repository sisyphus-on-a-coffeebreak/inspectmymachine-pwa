import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button
      variant="ghost"
      className="h-9 w-9 p-0"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
      onClick={toggle}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
