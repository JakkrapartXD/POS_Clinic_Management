'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
import { API_CONFIG } from '@/config/api';
const AddPatientForm = dynamic(() => import('@/components/forms/AddPatientForm'), {
  ssr: false
});
const EditPatientForm = dynamic(() => import('@/components/forms/EditPatientForm'), {
  ssr: false
});
import PageGuard from '@/components/guards/page-guard';

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
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const result = await GraphQLAPI.getAllPatients({});
      setPatients(result.patients.patients || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery) ||
    patient.national_id?.includes(searchQuery)
  );

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
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
    setSelectedPatient(null);
  };

  return (
    <PageGuard requiredPermission='patients:read'>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ป่วย</h1>
          <p className="text-gray-600">จัดการข้อมูลผู้ป่วยในระบบ</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={fetchPatients}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มผู้ป่วยใหม่
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ค้นหาผู้ป่วย (ชื่อ, นามสกุล, เบอร์โทร, เลขบัตรประชาชน)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลผู้ป่วย...</p>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'ไม่พบผู้ป่วยที่ค้นหา' : 'ยังไม่มีข้อมูลผู้ป่วย'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มผู้ป่วยคนแรก'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ป่วยใหม่
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {patient.photo_url ? (
                        <img
                          src={`${API_CONFIG.BASE_URL}${patient.photo_url}`}
                          alt={`${patient.first_name} ${patient.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-md ${patient.photo_url ? 'hidden' : ''}`}>
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {patient.gender || 'ไม่ระบุเพศ'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
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

                <div className="space-y-2">
                  {patient.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {patient.phone}
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {patient.email}
                    </div>
                  )}
                  {patient.national_id && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      {patient.national_id}
                    </div>
                  )}
                  {patient.date_of_birth && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{patient.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>สร้างเมื่อ: {format(new Date(patient.created_at), 'dd/MM/yyyy')}</span>
                    <Badge variant="outline" className="text-xs">
                      ID: {patient.id.slice(-6)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Patient Form */}
      <EditPatientForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          fetchPatients();
          resetForm();
        }}
        patientId={selectedPatient?.id || ''}
      />

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

      {/* Add Patient Form */}
      <AddPatientForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          fetchPatients();
          resetForm();
        }}
      />
    </div>
    </PageGuard>
  );
}

export default dynamic(() => Promise.resolve(PatientsPage), {
  ssr: false
});
