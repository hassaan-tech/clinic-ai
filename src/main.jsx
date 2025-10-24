import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { ThemeProvider } from "@/components/theme-provider"
import "./index.css"
import { Toaster } from "sonner"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    <Toaster richColors position="top-center" />  {/* ✅ toast support */}
  </React.StrictMode>
)
