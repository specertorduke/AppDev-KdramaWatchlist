import { useEffect, useState } from 'react'
import ThemeContext from './theme-context.js'

const THEME_STORAGE_KEY = 'sarangtv_theme'
const themes = ['dark', 'light', 'warm']

function getSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return themes.includes(savedTheme) ? savedTheme : 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
