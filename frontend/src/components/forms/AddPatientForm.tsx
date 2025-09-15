"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, Plus, User, MapPin, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { GraphQLAPI } from '@/clients/graphql'
import PatientImageUpload from '@/components/common/PatientImageUpload'

interface AddPatientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PatientFormData {
  // Personal Details
  national_id: string
  prefix: string
  gender: string
  first_name: string
  last_name: string
  nickname: string
  date_of_birth: string
  age: string
  blood_group: string
  email: string
  
  // Contact and Address
  phone: string
  address: string
  subdistrict: string
  district: string
  province: string
  zip_code: string
  
  // Medical Information
  drug_allergies: string
  drug_allergies_other: string
  medical_conditions: string
  notes: string
  
  
  // Photo
  photo: File | null
}

const prefixes = [
  { value: 'mr', label: 'นาย' },
  { value: 'mrs', label: 'นาง' },
  { value: 'miss', label: 'นางสาว' },
  { value: 'dr', label: 'แพทย์' },
  { value: 'prof', label: 'ศาสตราจารย์' }
]

const genders = [
  { value: 'male', label: 'ชาย' },
  { value: 'female', label: 'หญิง' },
  { value: 'other', label: 'อื่นๆ' }
]

const bloodGroups = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
]

const drugAllergies = [
  { value: 'penicillin', label: 'Penicillin' },
  { value: 'sulfa', label: 'Sulfa' },
  { value: 'aspirin', label: 'Aspirin' },
  { value: 'none', label: 'ไม่มี' },
  { value: 'other', label: 'อื่นๆ' }
]


const provinces = [
  { value: 'bangkok', label: 'กรุงเทพมหานคร' },
  { value: 'chiangmai', label: 'เชียงใหม่' },
  { value: 'phuket', label: 'ภูเก็ต' },
  { value: 'pattaya', label: 'พัทยา' }
]

export default function AddPatientForm({ isOpen, onClose, onSuccess }: AddPatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>({
    national_id: '',
    prefix: 'mr',
    gender: 'male',
    first_name: '',
    last_name: '',
    nickname: '',
    date_of_birth: '',
    age: '',
    blood_group: '',
    email: '',
    phone: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    zip_code: '',
    drug_allergies: '',
    drug_allergies_other: '',
    medical_conditions: '',
    notes: '',
    photo: null
  })

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      photo: file
    }))
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return ''
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age.toString()
  }

  const handleDateOfBirthChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      date_of_birth: value,
      age: calculateAge(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('กรุณากรอกชื่อและนามสกุล')
      return
    }

    try {
      setIsSubmitting(true)

      // Upload photo if provided
      let photoUrl = ''
      if (formData.photo) {
        const uploadResult = await GraphQLAPI.uploadImage(formData.photo, 'patient')
        photoUrl = uploadResult.url
      }

      // Create patient data
      const patientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        national_id: formData.national_id || undefined,
        prefix: formData.prefix || undefined,
        nickname: formData.nickname || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        blood_group: formData.blood_group || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        subdistrict: formData.subdistrict || undefined,
        district: formData.district || undefined,
        province: formData.province || undefined,
        zip_code: formData.zip_code || undefined,
        drug_allergies: formData.drug_allergies || undefined,
        drug_allergies_other: formData.drug_allergies_other || undefined,
        medical_conditions: formData.medical_conditions || undefined,
        notes: formData.notes || undefined,
        photo_url: photoUrl || undefined
      }

      await GraphQLAPI.createPatient(patientData)
      
      toast.success('เพิ่มผู้ป่วยใหม่เรียบร้อยแล้ว')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        national_id: '',
        prefix: 'mr',
        gender: 'male',
        first_name: '',
        last_name: '',
        nickname: '',
        date_of_birth: '',
        age: '',
        blood_group: '',
        email: '',
        phone: '',
        address: '',
        subdistrict: '',
        district: '',
        province: '',
        zip_code: '',
        drug_allergies: '',
        drug_allergies_other: '',
        medical_conditions: '',
        notes: '',
        photo: null
      })

    } catch (error: any) {
      console.error('Error creating patient:', error)
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ป่วย')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add customer</h2>
              <p className="text-sm text-gray-500">ID: HNS601008</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Photo */}
            <div className="lg:col-span-1">
              <PatientImageUpload
                value={formData.photo}
                onChange={handlePhotoChange}
                label="Customer Photo"
                description="รูปภาพจะถูกปรับขนาดเป็น 200x200 พิกเซลโดยอัตโนมัติ"
              />
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Personal Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="national_id">ID Card No/Passport</Label>
                      <Input
                        id="national_id"
                        value={formData.national_id}
                        onChange={(e) => handleInputChange('national_id', e.target.value)}
                        placeholder="1236555"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="prefix">Prefix</Label>
                      <Select value={formData.prefix} onValueChange={(value) => handleInputChange('prefix', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {prefixes.map((prefix) => (
                            <SelectItem key={prefix.value} value={prefix.value}>
                              {prefix.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Sex</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender.value} value={gender.value}>
                              {gender.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="first_name">Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="ชื่อ"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="last_name">Surname</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="นามสกุล"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="ชื่อเล่น"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="date_of_birth">Date of birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleDateOfBirthChange(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        placeholder="อายุ"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="blood_group">Blood group</Label>
                      <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมู่เลือด" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodGroups.map((group) => (
                            <SelectItem key={group.value} value={group.value}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="อีเมล"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact and Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>Contact and Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Tel</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="เบอร์โทรศัพท์"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="ที่อยู่"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subdistrict">Subdistrict</Label>
                      <Select value={formData.subdistrict} onValueChange={(value) => handleInputChange('subdistrict', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกตำบล" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sub1">ตำบล 1</SelectItem>
                          <SelectItem value="sub2">ตำบล 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="district">District</Label>
                      <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกอำเภอ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dist1">อำเภอ 1</SelectItem>
                          <SelectItem value="dist2">อำเภอ 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกจังหวัด" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.value} value={province.value}>
                              {province.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="zip_code">Zip code</Label>
                      <Select value={formData.zip_code} onValueChange={(value) => handleInputChange('zip_code', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรหัสไปรษณีย์" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10110">10110</SelectItem>
                          <SelectItem value="10120">10120</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <span>Medical Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="drug_allergies">Drug allergies</Label>
                      <Select value={formData.drug_allergies} onValueChange={(value) => handleInputChange('drug_allergies', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกการแพ้ยา" />
                        </SelectTrigger>
                        <SelectContent>
                          {drugAllergies.map((allergy) => (
                            <SelectItem key={allergy.value} value={allergy.value}>
                              {allergy.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.drug_allergies === 'other' && (
                      <div>
                        <Label htmlFor="drug_allergies_other">Drug allergies Other</Label>
                        <Input
                          id="drug_allergies_other"
                          value={formData.drug_allergies_other}
                          onChange={(e) => handleInputChange('drug_allergies_other', e.target.value)}
                          placeholder="ระบุการแพ้ยาอื่นๆ"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="medical_conditions">Medical conditions</Label>
                    <Textarea
                      id="medical_conditions"
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      placeholder="โรคประจำตัว"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Note</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="หมายเหตุ"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
