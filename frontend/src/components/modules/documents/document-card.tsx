import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface DocumentCardProps {
  id: string
  title: string
  subtitle: string
  href: string
  color?: string
}

export default function DocumentCard({ id, title, subtitle, href, color = "text-teal-600" }: DocumentCardProps) {
  return (
    <Link href={href}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className={`text-lg font-medium ${color}`}>{title}</h2>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
