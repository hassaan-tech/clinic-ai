import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect } from "react"

export function ThemeProvider({ children, ...props }) {
  // prevent flash on initial load
  useEffect(() => {
    document.body.classList.add("transition-colors", "duration-300")
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
