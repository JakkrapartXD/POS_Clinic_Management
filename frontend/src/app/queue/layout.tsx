import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../styles/globals.css"
import Sidebar from "@/components/layout/sidebar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SN Clinic | ระบบจัดการคิว",
  description: "ระบบจัดการคิวผู้ป่วย",
  generator: 'v0.dev'
}

export default function QueueLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-white">{children}</main>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}
