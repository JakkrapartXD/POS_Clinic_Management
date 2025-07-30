import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentHistoryItem {
  id: string
  status: string
  details: string
  amount: number
}

interface PaymentHistoryCardProps {
  payments: PaymentHistoryItem[]
}

export default function PaymentHistoryCard({ payments }: PaymentHistoryCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-gray-700">ประวัติการชำระ</CardTitle>
        <p className="text-sm text-gray-500">แสดงประวัติการชำระของคุณทั้งหมด</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 text-sm text-gray-500 pb-2 border-b">
          <div>สถานะ</div>
          <div>รายละเอียด</div>
          <div className="text-right">จำนวน</div>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y">
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-3 py-3">
                <div>{payment.status}</div>
                <div>{payment.details}</div>
                <div className="text-right">฿{payment.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">ยังไม่พบประวัติการชำระ</div>
        )}
      </CardContent>
    </Card>
  )
}
