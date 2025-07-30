import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import PageGuard from "@/components/guards/page-guard"

export default function DocumentsPage() {
  const documentTypes = [
    {
      id: "customer",
      title: "CUSTOMER",
      subtitle: "ลูกค้า",
      href: "/documents/customers",
      color: "text-purple-600",
    },
    {
      id: "contact",
      title: "CONTACT",
      subtitle: "ผู้ติดต่อ",
      href: "/documents/contacts",
      color: "text-purple-600",
    },
    {
      id: "qn",
      title: "QN",
      subtitle: "ใบเสนอราคา / Quotation",
      href: "/documents/quotations",
      color: "text-purple-600",
    },
    {
      id: "dn",
      title: "DN",
      subtitle: "ใบส่งสินค้า / Delivery Note",
      href: "/documents/delivery-notes",
      color: "text-purple-600",
    },
    {
      id: "bn",
      title: "BN",
      subtitle: "ใบวางบิล / Billing Note",
      href: "/documents/billing-notes",
      color: "text-purple-600",
    },
    {
      id: "rt",
      title: "RT",
      subtitle: "ใบเสร็จรับเงิน / Receipt",
      href: "/documents/receipts",
      color: "text-purple-600",
    },
    {
      id: "po",
      title: "PO",
      subtitle: "ใบสั่งซื้อสินค้า / Purchase Order",
      href: "/documents/purchase-orders",
      color: "text-purple-600",
    },
    {
      id: "gr",
      title: "GR",
      subtitle: "ใบรับสินค้า / Goods Receipt",
      href: "/documents/goods-receipts",
      color: "text-purple-600",
    },
    {
      id: "ro",
      title: "RO",
      subtitle: "ใบคืนสินค้า / Purchase Return Order",
      href: "/documents/return-orders",
      color: "text-purple-600",
    },
    {
      id: "pp9",
      title: "ภ.พ.๙",
      subtitle: "รายงานการซื้อทุกประเภท",
      href: "/documents/reports/pp9",
      color: "text-purple-600",
    },
    {
      id: "pp30",
      title: "ภ.พ.๓๐",
      subtitle: "รายงานการขายตามคุณพิเศษ",
      href: "/documents/reports/pp30",
      color: "text-purple-600",
    },
    {
      id: "pp33",
      title: "ภ.พ.๓๓",
      subtitle: "รายงานการขายอย่างตราย",
      href: "/documents/reports/pp33",
      color: "text-purple-600",
    },
    {
      id: "sales-report",
      title: "SALES REPORT",
      subtitle: "รายงานการขาย",
      href: "/documents/reports/sales",
      color: "text-purple-600",
    },
    {
      id: "product-sales-report",
      title: "PRODUCT SALES REPORT",
      subtitle: "รายงานการขายโดยสินค้า",
      href: "/documents/reports/product-sales",
      color: "text-purple-600",
    },
    {
      id: "goods-receipt-report",
      title: "GOODS RECEIPT REPORT",
      subtitle: "รายงานการรับสินค้า",
      href: "/documents/reports/goods-receipt",
      color: "text-purple-600",
    },
    {
      id: "inventory-report",
      title: "INVENTORY REPORT",
      subtitle: "รายงานสต็อกคงเหลือ",
      href: "/documents/reports/inventory",
      color: "text-purple-600",
    },
    {
      id: "sale-price-report",
      title: "SALE PRICE REPORT",
      subtitle: "รายงานราคาขายสินค้า",
      href: "/documents/reports/sale-price",
      color: "text-purple-600",
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
