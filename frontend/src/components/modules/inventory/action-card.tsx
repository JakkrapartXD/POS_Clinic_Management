"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface ActionCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  onClick?: () => void
}

export default function ActionCard({ icon: Icon, title, subtitle, onClick }: ActionCardProps) {
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex flex-col items-center">
        <Icon className="h-5 w-5 text-teal-500 mb-2" />
        <div className="text-teal-500 font-medium">{title}</div>
        <div className="text-gray-500 text-sm">{subtitle}</div>
      </CardContent>
    </Card>
  )
}
