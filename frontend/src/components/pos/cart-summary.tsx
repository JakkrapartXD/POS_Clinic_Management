interface CartSummaryProps {
  subtotal: number
  discount: number
  total: number
}

export default function CartSummary({ subtotal, discount, total }: CartSummaryProps) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">ราคาเฉพาะสินค้า</span>
        <span>{subtotal > 0 ? `฿${subtotal.toFixed(2)}` : "-"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">ส่วนลด (%)</span>
        <span>{discount > 0 ? `${discount}%` : "-"}</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>ยอดรวมสุทธิ</span>
        <span>฿{total.toFixed(2)}</span>
      </div>
    </div>
  )
}
