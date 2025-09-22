'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, User, Phone, Mail, MapPin, Plus, Clock, Eye, CreditCard, Trash2, ClipboardList, History, Stethoscope, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { API_CONFIG } from "@/config/api"
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';
import { parseDrugAllergies } from '@/utils/patient-utils';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_id?: string;
  prefix?: string;
  nickname?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  phone?: string;
  email?: string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zip_code?: string;
  drug_allergies?: string;
  drug_allergies_other?: string;
  medical_conditions?: string;
  notes?: string;
  photo_url?: string;
  photo_path?: string;
  created_at: string;
}

interface TriageTicket {
  id: string;
  number: number;
  status: string;
  station: string;
  patientId: string;
  priority: number;
  called_at?: string;
  started_at?: string;
  done_at?: string;
  created_at: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
}

const triageStatusColors: Record<string, string> = {
  waiting: 'bg-blue-100 text-blue-800',
  called: 'bg-yellow-100 text-yellow-800',
  in_service: 'bg-teal-100 text-teal-800',
  done: 'bg-green-100 text-green-800',
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [triageTickets, setTriageTickets] = useState<TriageTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTriage, setIsCreatingTriage] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Medical history modal states
  const [isMedicalHistoryModalOpen, setIsMedicalHistoryModalOpen] = useState(false);
  const [medicalHistoryData, setMedicalHistoryData] = useState<any>(null);
  const [isLoadingMedicalHistory, setIsLoadingMedicalHistory] = useState(false);
  const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  
  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatientData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous requests unless force refresh
    if (isFetching && !forceRefresh) {
      console.log('Already fetching patient data, skipping...');
      return;
    }

    if (!patientId) {
      console.log('No patient ID provided, skipping fetch...');
      return;
    }

    try {
      setIsFetching(true);
      setIsLoading(true);
      
      console.log('Fetching patient data for ID:', patientId, forceRefresh ? '(force refresh)' : '');
      
      // Fetch patient details using GraphQL API
      const patientResult = await GraphQLAPI.getPatient(patientId);

      console.log('Patient data fetched successfully:', patientResult.patient);
      console.log('Full patient result:', patientResult);
      console.log('About to set patient state with:', patientResult.patient);

      // Check if patient exists
      if (!patientResult.patient) {
        throw new Error('Patient not found');
      }

      // Update state
      console.log('Setting patient state...');
      setPatient(patientResult.patient);
      setTriageTickets([]); // No triage tickets to fetch for individual patient
      console.log('Patient state set successfully');

    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      
      // Set patient to null when there's an error
      setPatient(null);
      setTriageTickets([]);
      
      // Handle rate limiting specifically
      if (error.message?.includes('Rate limit exceeded') || error.message?.includes('RATE_LIMITED')) {
        toast.error('Too many requests. Please wait a moment and try again.');
        // Wait before allowing another request
        setTimeout(() => {
          setIsFetching(false);
        }, 5000);
      } else {
        toast.error(error.message || 'Failed to load patient data');
        setIsFetching(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [patientId, isFetching]);

  useEffect(() => {
    if (patientId && patientId.trim() !== '') {
      console.log('Patient ID received:', patientId);
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Check if we've fetched recently (within 2 seconds)
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      
      if (timeSinceLastFetch < 2000) {
        console.log('Skipping fetch - too recent:', timeSinceLastFetch, 'ms ago');
        return;
      }

      // Add a longer delay to prevent rapid successive calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPatientData();
        fetchAppointmentHistory(); // Also fetch appointment history when page loads
        lastFetchTimeRef.current = Date.now();
      }, 500);

      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    } else {
      console.log('No valid patient ID provided');
      setIsLoading(false);
    }
  }, [patientId, fetchPatientData]);


  const handleCreateTriage = async () => {
    try {
      setIsCreatingTriage(true);
      
      const result = await GraphQLAPI.createTriageTicket(patientId, 0);
      const newTicket = result.createTriageTicket;
      
      toast.success('เพิ่มคิวคัดกรองสำเร็จ!');
      
      // Navigate to the triage queue page
      router.push('/queue/triage');

    } catch (error: any) {
      console.error('Error creating triage ticket:', error);
      if (error.message?.includes('DUPLICATE_TRIAGE_TICKET_TODAY')) {
        toast.error('ผู้ป่วยนี้มีคิวคัดกรองที่ยังไม่เสร็จในวันนี้แล้ว');
      } else {
        toast.error(error.message || 'ไม่สามารถเพิ่มคิวคัดกรองได้');
      }
    } finally {
      setIsCreatingTriage(false);
    }
  };

  const fetchMedicalHistory = async () => {
    try {
      setIsLoadingMedicalHistory(true);
      setIsLoadingAppointments(true);
      
      // Fetch patient visits (medical history)
      const visitsResult = await GraphQLAPI.getPatientVisits(patientId, { take: 50 });
      const visits = visitsResult.patientVisits || [];
      
      console.log('Fetched visits:', visits);
      console.log('Visits with appointments:', visits.filter((visit: any) => visit.appointment));
      
      setMedicalHistoryData(visits);
      
      // Extract appointments from visits and filter out cancelled appointments
      const appointments = visits
        .filter((visit: any) => visit.appointment && visit.appointment.status !== 'cancelled')
        .map((visit: any) => ({
          ...visit.appointment,
          visitId: visit.id,
          visitDate: visit.visit_date
        }))
        .sort((a: any, b: any) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
      
      console.log('Extracted appointments:', appointments);
      setAppointmentHistory(appointments);
      
    } catch (error: any) {
      console.error('Error fetching medical history:', error);
      toast.error('ไม่สามารถโหลดประวัติการรักษาได้');
    } finally {
      setIsLoadingMedicalHistory(false);
      setIsLoadingAppointments(false);
    }
  };

  const fetchAppointmentHistory = async () => {
    try {
      setIsLoadingAppointments(true);
      
      // Fetch patient visits to get appointments
      const visitsResult = await GraphQLAPI.getPatientVisits(patientId, { take: 50 });
      const visits = visitsResult.patientVisits || [];
      
      // Extract appointments from visits and filter out cancelled appointments
      const appointments = visits
        .filter((visit: any) => visit.appointment && visit.appointment.status !== 'cancelled')
        .map((visit: any) => ({
          ...visit.appointment,
          visitId: visit.id,
          visitDate: visit.visit_date
        }))
        .sort((a: any, b: any) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
      
      setAppointmentHistory(appointments);
      
    } catch (error: any) {
      console.error('Error fetching appointment history:', error);
      toast.error('ไม่สามารถโหลดประวัติการนัดหมายได้');
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const openMedicalHistoryModal = async () => {
    setIsMedicalHistoryModalOpen(true);
    await fetchMedicalHistory();
  };

  const openDeleteModal = (appointment: any) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setAppointmentToDelete(null);
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      setIsDeleting(true);
      
      // Update appointment status to "cancelled" (soft delete)
      await GraphQLAPI.updateAppointment(appointmentToDelete.id, { 
        status: 'cancelled' 
      });
      toast.success('ลบนัดหมายสำเร็จ');
      
      // Refresh appointment history data
      await fetchAppointmentHistory();
      
      // Close modal
      closeDeleteModal();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error('ไม่สามารถลบนัดหมายได้');
    } finally {
      setIsDeleting(false);
    }
  };

  const markAppointmentAsVisited = async (appointmentId: string) => {
    try {
      // Note: Appointment status update is not available in current GraphQLAPI
      toast.error('ฟีเจอร์อัปเดตสถานะนัดหมายยังไม่พร้อมใช้งาน');
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะนัดหมายได้');
    }
  };

  const createQueueFromAppointment = async (appointmentId: string) => {
    try {
      if (patientId) {
        // Create new visit
        const visitResult = await GraphQLAPI.createVisit({
          patientId: patientId
        });
        
        // Create queue ticket for the new visit
        await GraphQLAPI.createQueueTicket({
          visitId: visitResult.createVisit.id,
          station: 'triage'
        });
        
        // Update appointment status to "visited"
        await GraphQLAPI.updateAppointment(appointmentId, { 
          status: 'visited' 
        });
        
        toast.success('สร้างคิวใหม่สำเร็จ และอัปเดตสถานะนัดหมาย');
        
        // Refresh appointment history data
        await fetchAppointmentHistory();
      }
    } catch (error: any) {
      console.error('Error creating queue from appointment:', error);
      toast.error('ไม่สามารถสร้างคิวใหม่ได้');
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient && !isLoading && !isFetching) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Patient not found</h2>
          <p className="text-gray-600 mt-2">The patient you're looking for doesn't exist.</p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600">
              <strong>Debug Info:</strong><br/>
              Patient ID: {patientId || 'undefined'}<br/>
              Loading: {isLoading ? 'true' : 'false'}<br/>
              Fetching: {isFetching ? 'true' : 'false'}<br/>
              Mounted: N/A
            </p>
          </div>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageGuard requiredPermission="patients:read">
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {/* Patient Photo */}
          <div className="flex-shrink-0">
            {patient.photo_url ? (
              <img
                src={`${API_CONFIG.BASE_URL}${patient.photo_url}`}
                alt={`${patient.first_name} ${patient.last_name}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg ${patient.photo_url ? 'hidden' : ''}`}>
              <User className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          {/* Patient Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600 mt-1">Patient ID: {patient.id}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* <Button 
            onClick={() => router.push(`/dashboard/patients/${patient.id}/receipts`)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            ดูประวัติการซื้อ
          </Button>
          <Button 
            onClick={handleCreateTriage}
            disabled={isCreatingTriage}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {isCreatingTriage ? 'กำลังเพิ่มคิว...' : 'เพิ่มคิวคัดกรอง'}
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold">
                    {patient.prefix && (
                      <span className="text-sm text-gray-500 mr-1">
                        {patient.prefix === 'mr' ? 'นาย' : 
                         patient.prefix === 'mrs' ? 'นาง' : 
                         patient.prefix === 'miss' ? 'นางสาว' : 
                         patient.prefix === 'dr' ? 'แพทย์' : 
                         patient.prefix === 'prof' ? 'ศาสตราจารย์' : patient.prefix}
                      </span>
                    )}
                    {patient.first_name} {patient.last_name}
                    {patient.nickname && (
                      <span className="text-sm text-gray-500 ml-2">({patient.nickname})</span>
                    )}
                  </p>
                </div>
                
                {patient.national_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">เลขบัตรประชาชน</label>
                    <p className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      {patient.national_id}
                    </p>
                  </div>
                )}

                {patient.age && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">อายุ</label>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      {patient.age} ปี
                    </p>
                  </div>
                )}

                {patient.blood_group && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">หมู่เลือด</label>
                    <p className="flex items-center gap-2">
                      <span className="w-4 h-4 text-gray-400">🩸</span>
                      {patient.blood_group}
                    </p>
                  </div>
                )}
                
                {patient.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      {format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                
                {patient.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p>{patient.gender}</p>
                  </div>
                )}
                
                {patient.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {patient.phone}
                    </p>
                  </div>
                )}
                
                {patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {patient.email}
                    </p>
                  </div>
                )}
              </div>
              
              {patient.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    {patient.address}
                    {patient.subdistrict && `, ${patient.subdistrict}`}
                    {patient.district && `, ${patient.district}`}
                    {patient.province && `, ${patient.province}`}
                    {patient.zip_code && ` ${patient.zip_code}`}
                  </p>
                </div>
              )}

              {/* Medical Information */}
              {(patient.drug_allergies || patient.medical_conditions || patient.notes) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">ข้อมูลทางการแพทย์</h4>
                  
                  {(() => {
                    // Parse drug allergies using utility function
                    const drugAllergies = parseDrugAllergies(patient.drug_allergies)
                    
                    return drugAllergies.length > 0 && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500">การแพ้ยา</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {drugAllergies.map((drug, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              ⚠️ {drug}
                            </span>
                          ))}
                        </div>
                        {patient.drug_allergies_other && (
                          <p className="text-sm text-red-600 mt-1">- {patient.drug_allergies_other}</p>
                        )}
                      </div>
                    )
                  })()}

                  {patient.medical_conditions && patient.medical_conditions !== '-' && (
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-500">โรคประจำตัว</label>
                      <p className="text-sm text-gray-700">{patient.medical_conditions}</p>
                    </div>
                  )}

                  {patient.notes && patient.notes !== '-' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">หมายเหตุ</label>
                      <p className="text-sm text-gray-700">{patient.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                การดำเนินการ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleCreateTriage}
                disabled={isCreatingTriage}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                {isCreatingTriage ? 'กำลังเพิ่มคิว...' : 'เพิ่มคิวคัดกรอง'}
              </Button>
              
              <Button 
                onClick={openMedicalHistoryModal}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                <History className="w-4 h-4 mr-2" />
                ดูประวัติการรักษา
              </Button>
              
              <Button 
                onClick={() => router.push('/queue/triage')}
                variant="outline"
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-2" />
                ดูคิวคัดกรอง
              </Button>
              
              <Button 
                onClick={() => router.push(`/dashboard/patients/${patient.id}/receipts`)}
                variant="outline"
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                ดูประวัติการซื้อ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment History Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ประวัติการนัดหมาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoadingAppointments && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm text-gray-600">กำลังโหลดประวัติการนัดหมาย...</span>
              </div>
            )}

            {/* Appointment History */}
            {!isLoadingAppointments && appointmentHistory && appointmentHistory.length > 0 && (
              <div className="space-y-3">
                {appointmentHistory.map((appointment: any) => (
                  <Card key={appointment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={appointment.status === 'visited' ? 'default' : 
                                    appointment.status === 'scheduled' ? 'secondary' : 'destructive'}
                          >
                            {appointment.status === 'visited' ? 'มาแล้ว' :
                             appointment.status === 'scheduled' ? 'นัดแล้ว' : appointment.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {format(new Date(appointment.appointment_time), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                        {appointment.doctor && (
                          <p className="text-xs text-gray-500 mt-1">
                            หมอ: {appointment.doctor.username}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          จาก visit: {format(new Date(appointment.visitDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createQueueFromAppointment(appointment.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            เพิ่มคิว
                          </Button>
                        )}
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteModal(appointment)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            ลบ
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingAppointments && (!appointmentHistory || appointmentHistory.length === 0) && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">ไม่มีประวัติการนัดหมาย</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>

    {/* Medical History Modal */}
    <Dialog open={isMedicalHistoryModalOpen} onOpenChange={setIsMedicalHistoryModalOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            ประวัติการรักษา - {patient?.first_name} {patient?.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Loading States */}
          {(isLoadingMedicalHistory || isLoadingAppointments) && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-gray-600">กำลังโหลดประวัติการรักษา...</span>
            </div>
          )}

          {/* Medical History Section */}
          {!isLoadingMedicalHistory && medicalHistoryData && medicalHistoryData.length > 0 && (
            <div className="space-y-4">
              {/* <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                ประวัติการรักษา
              </h3> */}
              
              <div className="space-y-4">
                {medicalHistoryData.map((visit: any) => (
                  <Card key={visit.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {format(new Date(visit.visit_date), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                      
                      {visit.chief_complaint && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">อาการสำคัญ:</p>
                          <p className="text-sm text-gray-600">{visit.chief_complaint}</p>
                        </div>
                      )}
                      
                      {visit.diagnosis && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">การวินิจฉัย:</p>
                          <p className="text-sm text-gray-600">{visit.diagnosis}</p>
                        </div>
                      )}
                      
                      {visit.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">แผนการรักษา:</p>
                          <p className="text-sm text-gray-600">{visit.notes}</p>
                        </div>
                      )}
                      
                      {visit.vitals && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {visit.vitals.heightCm && (
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="font-medium text-blue-800">ส่วนสูง</p>
                              <p className="text-blue-600">{visit.vitals.heightCm} cm</p>
                            </div>
                          )}
                          {visit.vitals.weightKg && (
                            <div className="bg-green-50 p-2 rounded">
                              <p className="font-medium text-green-800">น้ำหนัก</p>
                              <p className="text-green-600">{visit.vitals.weightKg} kg</p>
                            </div>
                          )}
                          {visit.vitals.tempC && (
                            <div className="bg-orange-50 p-2 rounded">
                              <p className="font-medium text-orange-800">อุณหภูมิ</p>
                              <p className="text-orange-600">{visit.vitals.tempC} °C</p>
                            </div>
                          )}
                          {visit.vitals.hr && (
                            <div className="bg-red-50 p-2 rounded">
                              <p className="font-medium text-red-800">อัตราการเต้นหัวใจ</p>
                              <p className="text-red-600">{visit.vitals.hr} bpm</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {visit.appointment && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-blue-800">นัดหมายครั้งต่อไป:</p>
                          <p className="text-sm text-blue-700">
                            {format(new Date(visit.appointment.appointment_time), 'dd/MM/yyyy HH:mm')} - {visit.appointment.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty States */}
          {!isLoadingMedicalHistory && !isLoadingAppointments && 
           (!medicalHistoryData || medicalHistoryData.length === 0) && (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่มีประวัติการรักษา</p>
            </div>
          )}

          {/* Empty State for Appointments */}
          {!isLoadingAppointments && appointmentHistory && appointmentHistory.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">ไม่มีประวัติการนัดหมาย</p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsMedicalHistoryModalOpen(false)}
              className="flex-1"
            >
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Modal */}
    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            ยืนยันการลบนัดหมาย
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {appointmentToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">วันที่นัดหมาย:</span>
                  <span className="text-sm">
                    {format(new Date(appointmentToDelete.appointment_time), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">เหตุผล:</span>
                  <span className="text-sm text-gray-600">{appointmentToDelete.reason}</span>
                </div>
                {appointmentToDelete.doctor && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">หมอ:</span>
                    <span className="text-sm text-gray-600">{appointmentToDelete.doctor.username}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800">คำเตือน</h4>
                <p className="text-sm text-red-700 mt-1">
                  คุณแน่ใจหรือไม่ที่จะลบนัดหมายนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={confirmDeleteAppointment}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบ
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </PageGuard>
  );
}
