'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const themeKey = 'stockly-theme'
const themeEvent = 'stockly-theme-change'

function getThemeSnapshot(): Theme {
  const stored = window.localStorage.getItem(themeKey)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getServerThemeSnapshot(): Theme {
  return 'light'
}

function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  window.addEventListener('storage', onChange)
  window.addEventListener(themeEvent, onChange)
  media.addEventListener('change', onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(themeEvent, onChange)
    media.removeEventListener('change', onChange)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
  }, [theme])

  const setTheme = (t: Theme) => {
    window.localStorage.setItem(themeKey, t)
    window.dispatchEvent(new Event(themeEvent))
  }
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
