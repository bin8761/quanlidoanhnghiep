import { Moon, Sun } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const label = t(isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối')

  return (
    <button
      className="icon-button relative overflow-hidden"
      type="button"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Sun
        aria-hidden="true"
        className={`absolute transition-all duration-300 ${
          isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
        size={18}
      />
      <Moon
        aria-hidden="true"
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
        size={18}
      />
    </button>
  )
}
