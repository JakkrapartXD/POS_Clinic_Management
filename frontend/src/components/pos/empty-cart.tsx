export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <div className="text-6xl mb-4">🛒</div>
      <p>ยังไม่มีรายการสินค้าที่ถูกเลือก</p>
      <p className="text-sm">สามารถเลือกสินค้าได้ทางด้านซ้าย</p>
    </div>
  )
}
