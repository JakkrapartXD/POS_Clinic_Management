import type React from "react"
interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
    </div>
  )
}
