import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../styles/globals.css"
import Sidebar from "@/components/layout/sidebar"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา",
  description: "Clinic Management System",
    generator: 'v0.dev'
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ErrorBoundary>
        <AuthProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-white">{children}</main>
          </div>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
