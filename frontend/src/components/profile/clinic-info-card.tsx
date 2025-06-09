import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ClinicInfoCardProps {
  email: string
  packageName: string
  packageDetails: string
}

export default function ClinicInfoCard({ email, packageName, packageDetails }: ClinicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-gray-700">ข้อมูลพิเศษ</CardTitle>
        <p className="text-sm text-gray-500">แสดงรายละเอียดพิเศษปัจจุบัน</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-gray-500">อีเมล:</div>
          <div className="col-span-2">{email}</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-gray-500">แพ็กเกจ:</div>
          <div className="col-span-2 flex items-center gap-2">
            {packageName}
            <Button variant="link" className="text-purple-500 p-0 h-auto">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <path d="M10 7 7 4l3-3"></path>
                  <path d="m10 17 3 3-3 3"></path>
                </svg>
                เปลี่ยนแพ็กเกจ
              </span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-gray-500">รายละเอียด:</div>
          <div className="col-span-2">{packageDetails}</div>
        </div>
      </CardContent>
    </Card>
  )
}
