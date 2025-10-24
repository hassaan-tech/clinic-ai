import { useEffect, useState } from "react"

const ACCENT_KEY = "accent-theme"

export function useAccentTheme() {
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem(ACCENT_KEY) || "green"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent)
    localStorage.setItem(ACCENT_KEY, accent)
  }, [accent])

  return { accent, setAccent }
}
