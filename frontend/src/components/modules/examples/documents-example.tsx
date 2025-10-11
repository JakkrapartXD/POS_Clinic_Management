"use client"

import { useState } from "react"
import DocumentCard from "@/components/modules/documents/document-card"
import PageHeader from "@/components/layout/page-header"
import PageContainer from "@/components/ui/page-container"
import CardGrid from "@/components/ui/card-grid"

export default function DocumentsExample() {
  const [documentTypes] = useState([
    {
      id: "customer",
      title: "CUSTOMER",
      subtitle: "ลูกค้า",
      href: "/documents/customers",
    },
    {
      id: "contact",
      title: "CONTACT",
      subtitle: "ผู้ติดต่อ",
      href: "/documents/contacts",
    },
    {
      id: "qn",
      title: "QN",
      subtitle: "ใบเสนอราคา / Quotation",
      href: "/documents/quotations",
    },
    {
      id: "dn",
      title: "DN",
      subtitle: "ใบส่งสินค้า / Delivery Note",
      href: "/documents/delivery-notes",
    },
    {
      id: "bn",
      title: "BN",
      subtitle: "ใบวางบิล / Billing Note",
      href: "/documents/billing-notes",
    },
    {
      id: "rt",
      title: "RT",
      subtitle: "ใบเสร็จรับเงิน / Receipt",
      href: "/documents/receipts",
    },
    {
      id: "po",
      title: "PO",
      href: "/documents/purchase-orders",
    },
    {
      id: "gr",
      title: "GR",
      subtitle: "ใบรับสินค้า / Goods Receipt",
      href: "/documents/goods-receipts",
    },
    {
      id: "ro",
      title: "RO",
      href: "/documents/return-orders",
    },
    {
      id: "pp9",
      title: "ภ.พ.๙",
      subtitle: "รายงานการซื้อทุกประเภท",
      href: "/documents/reports/pp9",
    },
    {
      id: "pp30",
      title: "ภ.พ.๓๐",
      subtitle: "รายงานการขายตามคุณพิเศษ",
      href: "/documents/reports/pp30",
    },
    {
      id: "pp33",
      title: "ภ.พ.๓๓",
      subtitle: "รายงานการขายอย่างตราย",
      href: "/documents/reports/pp33",
    },
    {
      id: "sales-report",
      title: "SALES REPORT",
      subtitle: "รายงานการขาย",
      href: "/documents/reports/sales",
    },
    {
      id: "product-sales-report",
      title: "PRODUCT SALES REPORT",
      subtitle: "รายงานการขายโดยสินค้า",
      href: "/documents/reports/product-sales",
    },
    {
      id: "goods-receipt-report",
      title: "GOODS RECEIPT REPORT",
      subtitle: "รายงานการรับสินค้า",
      href: "/documents/reports/goods-receipt",
    },
    {
      id: "inventory-report",
      title: "INVENTORY REPORT",
      subtitle: "รายงานสต็อกคงเหลือ",
      href: "/documents/reports/inventory",
    },
    {
      id: "sale-price-report",
      title: "SALE PRICE REPORT",
      subtitle: "รายงานราคาขายสินค้า",
      href: "/documents/reports/sale-price",
    },
  ])

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader title="เอกสาร" />

      <CardGrid columns={{ sm: 1, md: 2, lg: 4 }}>
        {documentTypes.map((doc) => (
          <DocumentCard key={doc.id} id={doc.id} title={doc.title} subtitle={doc.subtitle || ""} href={doc.href} />
        ))}
      </CardGrid>
    </PageContainer>
  )
}
