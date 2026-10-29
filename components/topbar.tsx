'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, Sun, Moon, Bell, Command } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { CommandPalette } from '@/components/command-palette'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex sm:w-80"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar productos, ventas...</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px]">
          <Command className="size-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted sm:hidden"
          aria-label="Buscar"
        >
          <Search className="size-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Notificaciones"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
        <div className="mx-1 h-8 w-px bg-border" />
        <button className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-muted">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            DM
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium">Diego Martínez</span>
            <span className="block text-xs text-muted-foreground">Administrador</span>
          </span>
        </button>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  )
}
