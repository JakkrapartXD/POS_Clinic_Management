import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import PageGuard from "@/components/guards/page-guard"

export default function DocumentsPage() {
  const documentTypes = [
    // {
    //   id: "customer",
    //   title: "CUSTOMER",
    //   subtitle: "ลูกค้า",
    //   href: "/dashboard/documents/customers",
    //   color: "text-teal-600",
    // },
    {
      id: "rt",
      title: "RT",
      subtitle: "ใบเสร็จรับเงิน / Receipt",
      href: "/dashboard/documents/receipts",
      color: "text-teal-600",
    },
  ]

  return (
    <PageGuard requiredPermission="documents">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">เอกสาร</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documentTypes.map((doc) => (
            <Link key={doc.id} href={doc.href}>
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h2 className={`text-lg font-medium ${doc.color}`}>{doc.title}</h2>
                  <p className="text-gray-500 text-sm">{doc.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageGuard>
  )
}