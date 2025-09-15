'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, Phone, Mail, MapPin, Plus, Clock, Eye, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patient details
      const patientResponse = await fetch(`/api/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query GetPatient($id: String!) {
              patient(id: $id) {
                id
                first_name
                last_name
                national_id
                date_of_birth
                gender
                phone
                email
                address
                created_at
              }
            }
          `,
          variables: { id: patientId }
        })
      });

      const patientData = await patientResponse.json();
      if (patientData.errors) {
        throw new Error(patientData.errors[0].message);
      }
      setPatient(patientData.data.patient);

      // Fetch recent visits
      const visitsResponse = await fetch(`/api/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query GetPatientVisits($patientId: String!) {
              patientVisits(patientId: $patientId, pagination: { limit: 10 }) {
                id
                visit_date
                status
                chief_complaint
                diagnosis
                notes
                vitals {
                  heightCm
                  weightKg
                  tempC
                  sbp
                  dbp
                  hr
                  spo2
                }
                queueTickets {
                  id
                  station
                  status
                  number
                }
              }
            }
          `,
          variables: { patientId }
        })
      });

      const visitsData = await visitsResponse.json();
      if (visitsData.errors) {
        throw new Error(visitsData.errors[0].message);
      }
      setVisits(visitsData.data.patientVisits || []);

    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      toast.error(error.message || 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVisit = async () => {
    try {
      setIsCreatingVisit(true);
      
      const response = await fetch(`/api/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation CreateVisit($input: CreateVisitInput!) {
              createVisit(input: $input) {
                id
                visit_date
                status
                patient {
                  id
                  first_name
                  last_name
                }
              }
            }
          `,
          variables: {
            input: {
              patientId: patientId
            }
          }
        })
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const newVisit = data.data.createVisit;
      toast.success('New visit created successfully!');
      
      // Navigate to the visit detail page
      router.push(`/dashboard/visits/${newVisit.id}`);

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
                  <p className="text-lg font-semibold">{patient.first_name} {patient.last_name}</p>
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
                  </p>
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
                      onClick={() => router.push(`/dashboard/visits/${visit.id}`)}
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
  );
}
