export default function Home() {
  // Middleware จัดการ redirect แล้ว
  // หน้านี้จะไม่ถูกแสดงเพราะ middleware จะ redirect ก่อน
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-lg text-gray-600">กำลังเปลี่ยนหน้า...</div>
      </div>
    </div>
  )
}
