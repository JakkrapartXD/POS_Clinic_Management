"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Import as FileImport,
  FileOutput as FileExport,
  Trash2,
  Barcode,
  Tag,
  Clipboard,
} from "lucide-react"

interface InventoryActionsGridProps {
  onAddProduct: () => void
  onImportProducts: () => void
  onExportProducts: () => void
  onDeleteProduct: () => void
  onPrintBarcode: () => void
  onPrintPriceTag: () => void
  onPrintMedicineLabel: () => void
  onProductReport: () => void
}

export default function InventoryActionsGrid({
  onAddProduct,
  onImportProducts,
  onExportProducts,
  onDeleteProduct,
  onPrintBarcode,
  onPrintPriceTag,
  onPrintMedicineLabel,
  onProductReport
}: InventoryActionsGridProps) {
  const allActions = [
    {
      id: 'add-product',
      icon: Plus,
      title: 'เพิ่มสินค้าใหม่',
      subtitle: 'สร้างสินค้าใหม่',
      onClick: onAddProduct
    },
    {
      id: 'import-products',
      icon: FileImport,
      title: 'เพิ่มชุดสินค้า/นำเข้า',
      subtitle: 'นำเข้าข้อมูล',
      onClick: onImportProducts
    },
    {
      id: 'export-products',
      icon: FileExport,
      title: 'ส่งออกยอดสินค้า',
      subtitle: 'ส่งออกข้อมูล',
      onClick: onExportProducts
    },
    {
      id: 'delete-product',
      icon: Trash2,
      title: 'ลบสินค้า',
      subtitle: 'ลบสินค้าออกจากระบบ',
      onClick: onDeleteProduct
    },
    {
      id: 'print-barcode',
      icon: Barcode,
      title: 'พิมพ์บาร์โค้ด',
      subtitle: 'พิมพ์บาร์โค้ดสินค้า',
      onClick: onPrintBarcode,
      disabled: true // Disabled as requested
    },
    {
      id: 'print-price-tag',
      icon: Tag,
      title: 'พิมพ์ป้ายราคาสินค้า',
      subtitle: 'พิมพ์ป้ายราคา',
      onClick: onPrintPriceTag,
      disabled: true // Disabled as requested
    },
    {
      id: 'print-medicine-label',
      icon: Tag,
      title: 'พิมพ์ฉลากยา',
      subtitle: 'พิมพ์ฉลากยา',
      onClick: onPrintMedicineLabel,
      disabled: true // Disabled as requested
    },
    {
      id: 'product-report',
      icon: Clipboard,
      title: 'รายงานรับเข้า/ออกของสินค้า',
      subtitle: 'รายงานการรับเข้า-ออก',
      onClick: onProductReport,
      disabled: true // Disabled as requested
    }
  ]

  // Filter out disabled actions
  const actions = allActions.filter(action => !action.disabled)

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        {actions.map((action) => {
          const IconComponent = action.icon
          return (
            <Card 
              key={action.id}
              className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" 
              onClick={action.onClick}
              data-testid={`${action.id}-button`}
            >
              <CardContent className="p-8 text-center">
                <IconComponent className="h-12 w-12 text-teal-500 mb-4 mx-auto" />
                <div className="text-teal-500 font-medium mb-2 text-lg">{action.title}</div>
                <div className="text-gray-500 text-sm">{action.subtitle}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
