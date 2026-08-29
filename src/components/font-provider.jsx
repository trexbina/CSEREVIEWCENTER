"use client"

import { createContext, useContext, useEffect, useState } from "react"

const FONT_OPTIONS = [
  // Primary Global System Font
  { key: "inter",            label: "Inter (Default)",         category: "Modern Web", family: "var(--font-inter), 'Inter', sans-serif", href: null },
  { key: "geist",            label: "Geist",                   category: "Sans-Serif", family: "system-ui, sans-serif", href: null },
  
  // Standard / System Fonts
  { key: "arial",            label: "Arial",                   category: "Standard Sans", family: "Arial, Helvetica, sans-serif", href: null },
  { key: "times-new-roman",  label: "Times New Roman",         category: "Standard Serif", family: "'Times New Roman', Times, serif", href: null },
  { key: "georgia",          label: "Georgia",                 category: "Standard Serif", family: "Georgia, serif", href: null },
  { key: "garamond",         label: "Garamond",                category: "Standard Serif", family: "Garamond, 'Baskerville', serif", href: null },
  { key: "verdana",          label: "Verdana",                 category: "Standard Sans", family: "Verdana, Geneva, sans-serif", href: null },
  { key: "trebuchet-ms",     label: "Trebuchet MS",            category: "Standard Sans", family: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif", href: null },
  { key: "tahoma",           label: "Tahoma",                  category: "Standard Sans", family: "Tahoma, Geneva, sans-serif", href: null },
  { key: "courier-new",      label: "Courier New",             category: "Monospace", family: "'Courier New', Courier, monospace", href: null },
  { key: "segoe-ui",         label: "Segoe UI",                category: "System Sans", family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", href: null },

  // Web / Modern Fonts
  { key: "roboto",           label: "Roboto",                  category: "Modern Web", family: "'Roboto', sans-serif",   href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" },
  { key: "poppins",          label: "Poppins",                 category: "Modern Web", family: "'Poppins', sans-serif",  href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" },
  { key: "outfit",           label: "Outfit",                  category: "Modern Web", family: "'Outfit', sans-serif",   href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" },
  { key: "nunito",           label: "Nunito",                  category: "Modern Web", family: "'Nunito', sans-serif",   href: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap" },
  { key: "open-sans",        label: "Open Sans",               category: "Modern Web", family: "'Open Sans', sans-serif",href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap" },
  { key: "lato",             label: "Lato",                    category: "Modern Web", family: "'Lato', sans-serif",     href: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" },
  { key: "montserrat",       label: "Montserrat",              category: "Modern Web", family: "'Montserrat', sans-serif",href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" },
]

const FontContext = createContext({ font: "inter", setFont: () => {} })

export function useFont() {
  return useContext(FontContext)
}

export { FONT_OPTIONS }

export function FontProvider({ children }) {
  const [font, setFontState] = useState("inter")
  const [mounted, setMounted] = useState(false)

  // Load saved preference from localStorage and Database
  useEffect(() => {
    const saved = localStorage.getItem("user-font")
    if (saved && FONT_OPTIONS.find((f) => f.key === saved)) {
      setFontState(saved)
    }

    // Also fetch user's saved preference from DB if logged in
    fetch("/api/user/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.font && FONT_OPTIONS.find((f) => f.key === data.font)) {
          setFontState(data.font)
          localStorage.setItem("user-font", data.font)
        }
      })
      .catch(() => {})
      .finally(() => setMounted(true))
  }, [])

  // Apply font to document when it changes
  useEffect(() => {
    if (!mounted) return

    const option = FONT_OPTIONS.find((f) => f.key === font)
    if (!option) return

    // Load the Google Font stylesheet if needed
    if (option.href) {
      const existingLink = document.querySelector(`link[data-font-key="${font}"]`)
      if (!existingLink) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = option.href
        link.setAttribute("data-font-key", font)
        document.head.appendChild(link)
      }
    }

    // Apply the font to the body
    document.body.style.fontFamily = option.family
  }, [font, mounted])

  const setFont = (key) => {
    setFontState(key)
    localStorage.setItem("user-font", key)

    // Save to database
    fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ font: key }),
    }).catch(() => {})
  }

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  )
}
