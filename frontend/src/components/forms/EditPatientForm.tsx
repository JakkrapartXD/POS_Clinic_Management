"use client"

import React, { useState, useEffect } from 'react'
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
import { API_CONFIG } from '@/config/api'
import PatientImageUpload from '@/components/common/PatientImageUpload'

interface EditPatientFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patientId: string // Patient ID to fetch data
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
  latitude: string
  longitude: string
  
  // Medical Information
  drug_allergies: string[]
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


export default function EditPatientForm({ isOpen, onClose, onSuccess, patientId }: EditPatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [formData, setFormData] = useState<PatientFormData>({
    // Personal Details
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
    
    // Contact and Address
    phone: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    
    // Medical Information
    drug_allergies: [],
    drug_allergies_other: '',
    medical_conditions: '',
    notes: '',
    
    // Photo
    photo: null
  })

  const [imageUrl, setImageUrl] = useState<string>('')
  const [newDrugAllergy, setNewDrugAllergy] = useState<string>('')

  // Fetch patient data when modal opens
  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientId && isOpen) {
        try {
          setIsLoading(true)
          const result = await GraphQLAPI.getPatient(patientId)
          const patientData = result.patient
          setPatient(patientData)
          
          // Set form data
          setFormData({
            // Personal Details
            national_id: patientData.national_id || '',
            prefix: patientData.prefix || 'mr',
            gender: patientData.gender || 'male',
            first_name: patientData.first_name || '',
            last_name: patientData.last_name || '',
            nickname: patientData.nickname || '',
            date_of_birth: patientData.date_of_birth ? new Date(patientData.date_of_birth).toISOString().split('T')[0] : '',
            age: patientData.age ? patientData.age.toString() : '',
            blood_group: patientData.blood_group || '',
            email: patientData.email || '',
            
            // Contact and Address
            phone: patientData.phone || '',
            address: patientData.address || '',
            subdistrict: patientData.subdistrict || '',
            district: patientData.district || '',
            province: patientData.province || '',
            zip_code: patientData.zip_code || '',
            latitude: patientData.latitude ? patientData.latitude.toString() : '',
            longitude: patientData.longitude ? patientData.longitude.toString() : '',
            
            // Medical Information
            drug_allergies: patientData.drug_allergies ? (typeof patientData.drug_allergies === 'string' ? (patientData.drug_allergies.startsWith('[') ? JSON.parse(patientData.drug_allergies) : [patientData.drug_allergies]) : patientData.drug_allergies) : [],
            drug_allergies_other: patientData.drug_allergies_other || '',
            medical_conditions: patientData.medical_conditions || '',
            notes: patientData.notes || '',
            
            // Photo
            photo: null
          })
          
          setImageUrl(patientData.photo_url || '')
        } catch (error: any) {
          console.error('Error fetching patient data:', error)
          toast.error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้')
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchPatientData()
  }, [patientId, isOpen])

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

  const handleAddDrugAllergy = () => {
    if (newDrugAllergy.trim() && !formData.drug_allergies.includes(newDrugAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        drug_allergies: [...prev.drug_allergies, newDrugAllergy.trim()]
      }))
      setNewDrugAllergy('')
    }
  }

  const handleRemoveDrugAllergy = (drugToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      drug_allergies: prev.drug_allergies.filter(drug => drug !== drugToRemove)
    }))
  }


  const handleDateOfBirthChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      date_of_birth: value
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
      let photoUrl = imageUrl
      if (formData.photo) {
        try {
          console.log('Uploading photo:', formData.photo.name, formData.photo.size, formData.photo.type)
          const uploadResult = await GraphQLAPI.uploadImage(formData.photo, 'patient')
          photoUrl = uploadResult.url
          console.log('Photo uploaded successfully:', photoUrl)
        } catch (uploadError: any) {
          console.error('Photo upload failed:', uploadError)
          toast.error('ไม่สามารถอัพโหลดรูปภาพได้: ' + (uploadError.message || 'Unknown error'))
          return // Stop submission if photo upload fails
        }
      }

      // Update patient data
      const updateData = {
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
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        drug_allergies: formData.drug_allergies.length > 0 ? JSON.stringify(formData.drug_allergies) : '',
        drug_allergies_other: formData.drug_allergies_other || undefined,
        medical_conditions: formData.medical_conditions || undefined,
        notes: formData.notes || undefined,
        photo_url: photoUrl || undefined
      }

      await GraphQLAPI.updatePatient(patientId, updateData)
      
      toast.success('แก้ไขข้อมูลผู้ป่วยสำเร็จ')
      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error updating patient:', error)
      toast.error('ไม่สามารถแก้ไขข้อมูลผู้ป่วยได้: ' + (error.message || 'เกิดข้อผิดพลาด'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูลผู้ป่วย...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              <h2 className="text-xl font-semibold text-gray-900">แก้ไขข้อมูลผู้ป่วย</h2>
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
                currentImageUrl={patient?.photo_url ? `${API_CONFIG.BASE_URL}${patient.photo_url}` : imageUrl}
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
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        placeholder="อายุ"
                        min="0"
                        max="150"
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
                        <Input
                          id="subdistrict"
                          value={formData.subdistrict}
                          onChange={(e) => setFormData(prev => ({ ...prev, subdistrict: e.target.value }))}
                          placeholder="ตำบล/แขวง"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="district">อำเภอ/เขต</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                          placeholder="อำเภอ/เขต"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="province">จังหวัด</Label>
                        <Input
                          id="province"
                          value={formData.province}
                          onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                          placeholder="จังหวัด"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="zip_code">รหัสไปรษณีย์</Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="รหัสไปรษณีย์"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* GPS Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="latitude">ละติจูด (Latitude)</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          placeholder="13.7563"
                          value={formData.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="longitude">ลองติจูด (Longitude)</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          placeholder="100.5018"
                          value={formData.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="drug_allergies">Drug allergies</Label>
                      <div className="flex gap-2">
                        <Input
                          id="drug_allergies"
                          value={newDrugAllergy}
                          onChange={(e) => setNewDrugAllergy(e.target.value)}
                          placeholder="ระบุยาที่แพ้ (เช่น Aspirin, Penicillin)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddDrugAllergy()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleAddDrugAllergy}
                          disabled={!newDrugAllergy.trim()}
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>รายการยาที่แพ้:</Label>
                      {formData.drug_allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.drug_allergies.map((drug, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{drug}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDrugAllergy(drug)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500 italic">
                          ไม่มีข้อมูลการแพ้ยา
                        </div>
                      )}
                    </div>
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
          <div className="flex justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด?')) {
                  // Reset to original patient data
                  if (patient) {
                    setFormData({
                      national_id: patient.national_id || '',
                      prefix: patient.prefix || 'mr',
                      gender: patient.gender || 'male',
                      first_name: patient.first_name || '',
                      last_name: patient.last_name || '',
                      nickname: patient.nickname || '',
                      date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '',
                      age: patient.age ? patient.age.toString() : '',
                      blood_group: patient.blood_group || '',
                      email: patient.email || '',
                      phone: patient.phone || '',
                      address: patient.address || '',
                      subdistrict: patient.subdistrict || '',
                      district: patient.district || '',
                      province: patient.province || '',
                      zip_code: patient.zip_code || '',
                      latitude: patient.latitude ? patient.latitude.toString() : '',
                      longitude: patient.longitude ? patient.longitude.toString() : '',
                      drug_allergies: patient.drug_allergies ? (typeof patient.drug_allergies === 'string' ? (patient.drug_allergies.startsWith('[') ? JSON.parse(patient.drug_allergies) : [patient.drug_allergies]) : patient.drug_allergies) : [],
                      drug_allergies_other: patient.drug_allergies_other || '',
                      medical_conditions: patient.medical_conditions || '',
                      notes: patient.notes || '',
                      photo: null
                    })
                    setImageUrl(patient.photo_url || '')
                  }
                  toast.success('รีเซ็ตข้อมูลเรียบร้อยแล้ว')
                }
              }}
              className="text-gray-500 hover:text-red-600"
            >
              รีเซ็ตข้อมูล
            </Button>
            
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}