'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Phone, Mail, MapPin, Plus, Clock, Eye, CreditCard, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { API_CONFIG } from "@/config/api"
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';

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
                  
                  {patient.drug_allergies && patient.drug_allergies !== 'none' && (
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-500">การแพ้ยา</label>
                      <p className="text-sm text-red-600">⚠️ {patient.drug_allergies}</p>
                      {patient.drug_allergies_other && (
                        <p className="text-sm text-red-600 ml-4">- {patient.drug_allergies_other}</p>
                      )}
                    </div>
                  )}

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

    </div>
    </PageGuard>
  );
}
