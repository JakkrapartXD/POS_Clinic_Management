import type React from "react"
import Sidebar from "@/components/layout/sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-white">{children}</main>
    </div>
  )
}
