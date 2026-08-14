import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ModuleTogglesProvider } from "@/lib/terminal-context"
import { IotChannelProvider } from "@/components/iot-channel-provider"
import { AppThemeProvider } from "@/components/theme/app-theme-provider"
import { THEME_ANTI_FLASH_SCRIPT } from "@/lib/theme-presets"
import appLogo from "../app logog  3 last.png"
import "./globals.css"

export const metadata: Metadata = {
  title: "University of New York Tirana Portal",
  description: "Course, student, and campus operations in one workspace",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: appLogo.src,
        type: "image/png",
      },
    ],
    apple: appLogo.src,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#101a34",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_ANTI_FLASH_SCRIPT }} />
        <AppThemeProvider>
        <div className="relative min-h-screen">
          <div
            className="pointer-events-none absolute inset-0 -z-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 14% 14%, rgba(25,146,200,0.30), transparent 33%), radial-gradient(circle at 86% 10%, rgba(103,190,228,0.28), transparent 24%), radial-gradient(circle at 50% 88%, rgba(21,99,197,0.16), transparent 36%), linear-gradient(180deg, color-mix(in oklab, var(--background) 92%, white 8%) 0%, var(--background) 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.56),transparent_42%)] opacity-90"
            aria-hidden
          />
          <div className="relative z-10 min-h-screen">
            <AuthProvider>
              <ModuleTogglesProvider>
                <IotChannelProvider>{children}</IotChannelProvider>
              </ModuleTogglesProvider>
            </AuthProvider>
          </div>
        </div>
        </AppThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
