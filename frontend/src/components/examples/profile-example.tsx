"use client"

import { useState } from "react"
import ClinicInfoCard from "@/components/profile/clinic-info-card"
import PaymentHistoryCard from "@/components/profile/payment-history-card"
import PageHeader from "@/components/layout/page-header"
import PageContainer from "@/components/ui/page-container"

export default function ProfileExample() {
  const [clinicInfo] = useState({
    email: "jakkrapart.x78@gmail.com",
    packageName: "Basic",
    packageDetails: "แพ็กเกจ Basic - ฟรีตลอดชีพ ไม่มีค่าใช้จ่าย",
  })

  const [payments] = useState<any[]>([])

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader title="ข้อมูลคลินิก" />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full mb-4"></div>
          <h2 className="text-xl font-medium">SN clinic</h2>
          <p className="text-gray-500">jakkrapart.x78@gmail.com</p>
        </div>

        <div className="md:col-span-2">
          <ClinicInfoCard
            email={clinicInfo.email}
            packageName={clinicInfo.packageName}
            packageDetails={clinicInfo.packageDetails}
          />

          <PaymentHistoryCard payments={payments} />
        </div>
      </div>
    </PageContainer>
  )
}
