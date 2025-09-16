'use client'

import React, { useState } from 'react'
import {
  ThailandAddressTypeahead,
  ThailandAddressValue,
} from 'react-thailand-address-typeahead'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import '@/styles/thailand-address.css'

interface ThailandAddressSelectorProps {
  value: {
    subdistrict: string
    district: string
    province: string
    zipCode: string
  }
  onChange: (address: {
    subdistrict: string
    district: string
    province: string
    zipCode: string
  }) => void
  disabled?: boolean
}

export default function ThailandAddressSelector({
  value,
  onChange,
  disabled = false
}: ThailandAddressSelectorProps) {
  const [addressValue, setAddressValue] = useState<ThailandAddressValue>(() => {
    // Initialize with current values if available
    if (value.subdistrict && value.district && value.province && value.zipCode) {
      return ThailandAddressValue.fromDatasourceItem({
        d: value.district,
        p: value.province,
        po: value.zipCode,
        s: value.subdistrict,
      })
    }
    return ThailandAddressValue.empty()
  })

  const handleValueChange = (newValue: ThailandAddressValue) => {
    setAddressValue(newValue)
    
    // Extract values and call onChange
    const addressData = {
      subdistrict: newValue.subdistrict || '',
      district: newValue.district || '',
      province: newValue.province || '',
      zipCode: newValue.postalCode || ''
    }
    
    onChange(addressData)
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-gray-700">
        ที่อยู่ (เลือกจากระบบ)
      </Label>
      
      <div className="relative thailand-address-container">
        <ThailandAddressTypeahead
          value={addressValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          className="space-y-3"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="subdistrict" className="text-xs text-gray-600">
              ตำบล/แขวง
            </Label>
            <ThailandAddressTypeahead.SubdistrictInput 
              id="subdistrict"
              placeholder="เลือกตำบล/แขวง"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="district" className="text-xs text-gray-600">
              อำเภอ/เขต
            </Label>
            <ThailandAddressTypeahead.DistrictInput 
              id="district"
              placeholder="เลือกอำเภอ/เขต"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="province" className="text-xs text-gray-600">
              จังหวัด
            </Label>
            <ThailandAddressTypeahead.ProvinceInput 
              id="province"
              placeholder="เลือกจังหวัด"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="zipCode" className="text-xs text-gray-600">
              รหัสไปรษณีย์
            </Label>
            <ThailandAddressTypeahead.PostalCodeInput 
              id="zipCode"
              placeholder="รหัสไปรษณีย์"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <ThailandAddressTypeahead.Suggestion 
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1"
        />
        </ThailandAddressTypeahead>
      </div>
    </div>
  )
}
