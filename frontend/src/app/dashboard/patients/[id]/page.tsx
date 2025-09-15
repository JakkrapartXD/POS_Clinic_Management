'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Phone, Mail, MapPin, Plus, Clock, Eye, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

interface Visit {
  id: string;
  visit_date: string;
  status: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  vitals?: {
    heightCm?: number;
    weightKg?: number;
    tempC?: number;
    sbp?: number;
    dbp?: number;
    hr?: number;
    spo2?: number;
  };
  queueTickets: Array<{
    id: string;
    station: string;
    status: string;
    number: number;
  }>;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  triage: 'bg-yellow-100 text-yellow-800',
  doctor: 'bg-purple-100 text-purple-800',
  pharmacy: 'bg-green-100 text-green-800',
  cashier: 'bg-orange-100 text-orange-800',
  done: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchPatientData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetching) {
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
      
      console.log('Fetching patient data for ID:', patientId);
      
      // Fetch patient details and visits using GraphQL API
      const [patientResult, visitsResult] = await Promise.all([
        GraphQLAPI.getPatient(patientId),
        GraphQLAPI.getPatientVisits(patientId, { take: 10 })
      ]);

      console.log('Patient data fetched successfully:', patientResult.patient);
      console.log('Visits data fetched successfully:', visitsResult.patientVisits);

      // Only update state if component is still mounted
      if (isMounted) {
        setPatient(patientResult.patient);
        setVisits(visitsResult.patientVisits || []);
      }

    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      
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
  }, [patientId, isFetching, isMounted]);

  useEffect(() => {
    if (patientId) {
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
    }
  }, [patientId, fetchPatientData]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleCreateVisit = async () => {
    try {
      setIsCreatingVisit(true);
      
      const result = await GraphQLAPI.createVisit({ patientId });
      const newVisit = result.createVisit;
      
      toast.success('New visit created successfully!');
      
      // Navigate to the visit detail page in the same window
      // Use window.location to ensure it opens in the same window
      window.location.href = `/dashboard/visits/${newVisit.id}`;

    } catch (error: any) {
      console.error('Error creating visit:', error);
      toast.error(error.message || 'Failed to create visit');
    } finally {
      setIsCreatingVisit(false);
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

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Patient not found</h2>
          <p className="text-gray-600 mt-2">The patient you're looking for doesn't exist.</p>
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

  return (
    <PageGuard requiredPermission="patients:read">
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-gray-600 mt-1">Patient ID: {patient.id}</p>
        </div>
        <Button 
          onClick={handleCreateVisit}
          disabled={isCreatingVisit}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingVisit ? 'Creating...' : 'เริ่มรอบตรวจ'}
        </Button>
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

        {/* Recent Visits */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Visits
                </span>
                <Badge variant="secondary">{visits.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No visits yet</p>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 5).map((visit) => (
                    <div 
                      key={visit.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/visits/${visit.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={statusColors[visit.status] || 'bg-gray-100 text-gray-800'}>
                          {visit.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(visit.visit_date), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      
                      {visit.chief_complaint && (
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Chief Complaint:</strong> {visit.chief_complaint}
                        </p>
                      )}
                      
                      {visit.diagnosis && (
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Diagnosis:</strong> {visit.diagnosis}
                        </p>
                      )}
                      
                      {visit.queueTickets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {visit.queueTickets.map((ticket) => (
                            <Badge key={ticket.id} variant="outline" className="text-xs">
                              {ticket.station} #{ticket.number}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Visit ID: {visit.id.slice(-8)}</span>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {visits.length > 5 && (
                    <Button variant="outline" className="w-full">
                      View All Visits ({visits.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PageGuard>
  );
}
