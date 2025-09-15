'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  CalendarDays, 
  CreditCard,
  User,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface CreatePatientInput {
  first_name: string;
  last_name: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface UpdatePatientInput extends CreatePatientInput {
  id: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<CreatePatientInput>({
    first_name: '',
    last_name: '',
    national_id: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getAllPatients({
        pagination: { skip: 0, take: 100 }
      });

      setPatients(result.patients.patients || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error(error.message || 'ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
    } finally {
      setIsLoading(false);
    }
  };

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      fetchPatients();
      return;
    }

    try {
      const result = await GraphQLAPI.searchPatients(query);
      setPatients(result.searchPatients || []);
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast.error(error.message || 'ไม่สามารถค้นหาผู้ป่วยได้');
    }
  };

  const handleCreatePatient = async () => {
    try {
      setIsSubmitting(true);
      
      const result = await GraphQLAPI.createPatient({
        first_name: formData.first_name,
        last_name: formData.last_name,
        national_id: formData.national_id || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });

      toast.success('เพิ่มผู้ป่วยใหม่เรียบร้อยแล้ว');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPatients();

    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'ไม่สามารถเพิ่มผู้ป่วยได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      setIsSubmitting(true);
      
      const result = await GraphQLAPI.updatePatient(selectedPatient.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        national_id: formData.national_id || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
      });

      toast.success('อัปเดตข้อมูลผู้ป่วยเรียบร้อยแล้ว');
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      resetForm();
      fetchPatients();

    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'ไม่สามารถอัปเดตข้อมูลผู้ป่วยได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    try {
      setIsSubmitting(true);
      
      await GraphQLAPI.deletePatient(selectedPatient.id);

      toast.success('ลบผู้ป่วยเรียบร้อยแล้ว');
      setIsDeleteDialogOpen(false);
      setSelectedPatient(null);
      fetchPatients();

    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error(error.message || 'ไม่สามารถลบผู้ป่วยได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      national_id: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      national_id: patient.national_id || '',
      date_of_birth: patient.date_of_birth ? format(new Date(patient.date_of_birth), 'yyyy-MM-dd') : '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.national_id?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8" />
            จัดการผู้ป่วย
          </h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลผู้ป่วยทั้งหมด</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchPatients} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มผู้ป่วยใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ป่วยใหม่</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">ชื่อ *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="ชื่อ"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="last_name">นามสกุล *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="นามสกุล"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="national_id">เลขบัตรประชาชน</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>
                
                <div>
                  <Label htmlFor="date_of_birth">วันเกิด</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">เพศ</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address">ที่อยู่</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="ที่อยู่"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleCreatePatient} 
                  disabled={isSubmitting || !formData.first_name || !formData.last_name}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ค้นหาผู้ป่วย (ชื่อ, นามสกุล, เลขบัตรประชาชน, เบอร์โทร, อีเมล)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchPatients(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {patient.first_name} {patient.last_name}
                  </CardTitle>
                  {patient.national_id && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <CreditCard className="w-3 h-3" />
                      {patient.national_id}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/dashboard/patients/${patient.id}`, '_blank')}
                    title="ดูรายละเอียด"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(patient)}
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteDialog(patient)}
                    title="ลบ"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {patient.phone}
                  </div>
                )}
                
                {patient.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {patient.email}
                  </div>
                )}
                
                {patient.date_of_birth && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="w-4 h-4" />
                    {format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}
                  </div>
                )}
                
                {patient.gender && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    {patient.gender}
                  </div>
                )}
                
                {patient.address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="line-clamp-2">{patient.address}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>สร้างเมื่อ: {format(new Date(patient.created_at), 'dd/MM/yyyy')}</span>
                  <Badge variant="outline">ID: {patient.id.slice(-8)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบผู้ป่วย</h3>
          <p className="text-gray-600">
            {searchTerm ? 'ไม่พบผู้ป่วยที่ตรงกับการค้นหา' : 'ยังไม่มีผู้ป่วยในระบบ'}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ป่วย</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_first_name">ชื่อ *</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="ชื่อ"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_last_name">นามสกุล *</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="นามสกุล"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_national_id">เลขบัตรประชาชน</Label>
              <Input
                id="edit_national_id"
                value={formData.national_id}
                onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                placeholder="1234567890123"
                maxLength={13}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_date_of_birth">วันเกิด</Label>
              <Input
                id="edit_date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_gender">เพศ</Label>
              <select
                id="edit_gender"
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกเพศ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="edit_phone">เบอร์โทรศัพท์</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0123456789"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit_email">อีเมล</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit_address">ที่อยู่</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="ที่อยู่"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleUpdatePatient} 
              disabled={isSubmitting || !formData.first_name || !formData.last_name}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ป่วย</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600">
              คุณต้องการลบผู้ป่วย <strong>{selectedPatient?.first_name} {selectedPatient?.last_name}</strong> หรือไม่?
            </p>
            <p className="text-sm text-red-600 mt-2">
              การกระทำนี้ไม่สามารถยกเลิกได้
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePatient}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังลบ...' : 'ลบผู้ป่วย'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
