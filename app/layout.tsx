import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "MediCore - Hospital Management System",
  description: "Comprehensive SaaS hospital management solution",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        {/* Medical ID validator script - removes non-compliant IDs like "MOHAM" */}
        <script src="/js/id-validator.js" defer></script>
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="medicore-theme"
        >
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
        <div id="portal-root" />
        {/* Hidden notification for medical ID validation */}
        <div id="id-validation-notification" style={{ display: 'none', position: 'fixed', bottom: '20px', right: '20px', padding: '12px', backgroundColor: '#f8d7da', borderRadius: '4px', zIndex: 9999 }}>
          Invalid medical ID detected and removed. Page will reload.
        </div>
      </body>
    </html>
  )
}
