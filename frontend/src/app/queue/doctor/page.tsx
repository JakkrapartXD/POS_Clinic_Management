'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  Phone, 
  Play, 
  CheckCircle, 
  RefreshCw,
  Activity,
  Eye,
  Stethoscope,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Zap,
  User,
  FileText,
  Search,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';
import { QUEUE_TICKET_STATUS, QUEUE_TICKET_STATION } from '@/constants';

interface DoctorTicket {
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
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  visit?: {
    id: string;
    status: string;
    chief_complaint?: string;
    diagnosis?: string;
    notes?: string;
    vitals?: {
      visitId: string;
      heightCm?: number;
      weightKg?: number;
      tempC?: number;
      sbp?: number;
      dbp?: number;
      hr?: number;
      rr?: number;
      spo2?: number;
      bmi?: number;
    };
  };
  events: Array<{
    id: string;
    status: string;
    at: string;
    byUserId?: string;
    note?: string;
  }>;
}

const statusConfig = {
  waiting: { label: 'รอเรียก', color: 'bg-blue-100 text-blue-800', icon: Clock },
  called: { label: 'เรียกแล้ว', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  in_service: { label: 'กำลังตรวจ', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800', icon: CheckCircle },
};

export default function DoctorQueuePage() {
  const [doctorTickets, setDoctorTickets] = useState<DoctorTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Vitals modal states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<DoctorTicket | null>(null);
  
  // Doctor consultation modal states
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    chief_complaint: '',
    diagnosis: '',
    notes: '',
    next_appointment_date: '',
    next_appointment_reason: ''
  });
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);
  const [existingConsultation, setExistingConsultation] = useState<any>(null);
  const [isLoadingConsultation, setIsLoadingConsultation] = useState(false);

  useEffect(() => {
    fetchDoctorQueue();
    // Set up polling for real-time updates
    const interval = setInterval(fetchDoctorQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const fetchDoctorQueue = async () => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getQueueTickets({
        station: QUEUE_TICKET_STATION.DOCTOR,
        status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
        pagination: { take: 100 }
      });
      
      setDoctorTickets(result.queueTickets || []);

    } catch (error: any) {
      console.error('Error fetching doctor queue:', error);
      toast.error(error.message || 'ไม่สามารถโหลดคิวหมอได้');
    } finally {
      setIsLoading(false);
    }
  };

  const callTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'called');
      
      // Update state immediately
      setDoctorTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'called', called_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('เรียกผู้ป่วยแล้ว');

    } catch (error: any) {
      console.error('Error calling ticket:', error);
      toast.error(error.message || 'ไม่สามารถเรียกผู้ป่วยได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const startTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'in_service');
      
      // Update state immediately
      setDoctorTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'in_service', started_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('เริ่มการตรวจแพทย์แล้ว');

    } catch (error: any) {
      console.error('Error starting ticket:', error);
      toast.error(error.message || 'ไม่สามารถเริ่มการตรวจได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, QUEUE_TICKET_STATUS.DONE);
      
      // Update state immediately
      setDoctorTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'done', done_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('การตรวจแพทย์เสร็จสิ้น');

    } catch (error: any) {
      console.error('Error completing ticket:', error);
      toast.error(error.message || 'ไม่สามารถเสร็จสิ้นการตรวจได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const fetchExistingConsultation = async (visitId: string) => {
    try {
      setIsLoadingConsultation(true);
      const result = await GraphQLAPI.getVisit(visitId);
      return result.visit || null;
    } catch (error: any) {
      console.error('Error fetching existing consultation:', error);
      return null;
    } finally {
      setIsLoadingConsultation(false);
    }
  };

  const openVitalsModal = (ticket: DoctorTicket) => {
    setSelectedTicket(ticket);
    setIsVitalsModalOpen(true);
  };

  const openConsultationModal = async (ticket: DoctorTicket) => {
    setSelectedTicket(ticket);
    setIsConsultationModalOpen(true);
    
    // Reset form first
    setConsultationForm({
      chief_complaint: '',
      diagnosis: '',
      notes: '',
      next_appointment_date: '',
      next_appointment_reason: ''
    });
    setExistingConsultation(null);
    
    // Fetch existing consultation data if visit exists
    if (ticket.visit?.id) {
      const existingData = await fetchExistingConsultation(ticket.visit.id);
      if (existingData) {
        setExistingConsultation(existingData);
        
        // Format appointment date for input field
        let appointmentDate = '';
        let appointmentReason = '';
        
        if (existingData.appointment) {
          const appointmentTime = new Date(existingData.appointment.appointment_time);
          appointmentDate = appointmentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
          appointmentReason = existingData.appointment.reason || '';
        }
        
        // Populate form with existing data
        setConsultationForm({
          chief_complaint: existingData.chief_complaint || '',
          diagnosis: existingData.diagnosis || '',
          notes: existingData.notes || '',
          next_appointment_date: appointmentDate,
          next_appointment_reason: appointmentReason
        });
      }
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedTicket?.visit) {
      toast.error('ไม่พบข้อมูลการมาเยี่ยมสำหรับตั๋วนี้');
      return;
    }

    console.log('Selected ticket:', selectedTicket);
    console.log('Patient ID:', selectedTicket.patientId);

    try {
      setIsSavingConsultation(true);
      
      // Check if consultation data has changed
      const hasDataChanged = 
        existingConsultation?.chief_complaint !== consultationForm.chief_complaint ||
        existingConsultation?.diagnosis !== consultationForm.diagnosis ||
        existingConsultation?.notes !== consultationForm.notes;
      
      // Check if appointment data has changed
      const hasAppointmentChanged = 
        consultationForm.next_appointment_date && consultationForm.next_appointment_reason &&
        (!existingConsultation?.appointment || 
         existingConsultation.appointment.reason !== consultationForm.next_appointment_reason ||
         new Date(existingConsultation.appointment.appointment_time).toISOString().split('T')[0] !== consultationForm.next_appointment_date);
      
      // Update visit with consultation data only if data has changed
      if (hasDataChanged || !existingConsultation) {
        await GraphQLAPI.updateVisit(selectedTicket.visit.id, {
          chief_complaint: consultationForm.chief_complaint,
          diagnosis: consultationForm.diagnosis,
          notes: consultationForm.notes
        });
      }
      
      // Create next appointment if date and reason are provided and appointment has changed
      if (consultationForm.next_appointment_date && consultationForm.next_appointment_reason && hasAppointmentChanged) {
        try {
          // Get current user to use as doctor
          const currentUser = await GraphQLAPI.getCurrentUser();
          
          console.log('Current user:', currentUser.me);
          console.log('User role:', currentUser.me.role);
          
          // Set time to 9:00 AM for the appointment date
          const appointmentDate = new Date(consultationForm.next_appointment_date);
          appointmentDate.setHours(9, 0, 0, 0); // 9:00 AM
          
          const patientId = selectedTicket.patientId || selectedTicket.patient?.id;
          
          console.log('Creating appointment with:', {
            patientId: patientId,
            doctorId: currentUser.me.id,
            userRole: currentUser.me.role,
            appointment_time: appointmentDate.toISOString(),
            reason: consultationForm.next_appointment_reason
          });
          
          if (!patientId) {
            throw new Error('Patient ID is missing');
          }
          
          const appointmentResult = await GraphQLAPI.createAppointment({
            patientId: patientId,
            doctorId: currentUser.me.id,
            appointment_time: appointmentDate.toISOString(),
            reason: consultationForm.next_appointment_reason
          });
          
          // Update visit with appointmentId
          await GraphQLAPI.updateVisit(selectedTicket.visit.id, {
            appointmentId: appointmentResult.createAppointment.id
          });
          
          toast.success(hasDataChanged || !existingConsultation ? 
            'บันทึกข้อมูลการตรวจและนัดหมายครั้งต่อไปสำเร็จ!' : 
            'อัปเดตนัดหมายครั้งต่อไปสำเร็จ!');
        } catch (appointmentError: any) {
          console.error('Error creating appointment:', appointmentError);
          toast.error(hasDataChanged || !existingConsultation ? 
            'บันทึกข้อมูลการตรวจสำเร็จ แต่ไม่สามารถสร้างนัดหมายได้' : 
            'ไม่สามารถอัปเดตนัดหมายได้');
        }
      } else {
        const hasAnyChanges = hasDataChanged || hasAppointmentChanged;
        toast.success(hasAnyChanges || !existingConsultation ? 
          'บันทึกข้อมูลการตรวจสำเร็จ!' : 
          'ไม่มีการเปลี่ยนแปลงข้อมูล');
      }
      
      // Create cashier queue ticket
      try {
        await GraphQLAPI.createQueueTicket({
          visitId: selectedTicket.visit.id,
          station: 'cashier'
        });
        toast.success('ส่งผู้ป่วยไปคิวแคชเชียร์แล้ว');
      } catch (error: any) {
        // If ticket already exists, that's fine
        if (error.message?.includes('Active queue ticket already exists')) {
          toast.success('ผู้ป่วยอยู่ในคิวแคชเชียร์แล้ว');
        } else {
          console.error('Error creating cashier queue ticket:', error);
        }
      }
      
      // Update the selected ticket with consultation data
      if (selectedTicket) {
        setDoctorTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                visit: ticket.visit ? {
                  ...ticket.visit,
                  chief_complaint: consultationForm.chief_complaint,
                  diagnosis: consultationForm.diagnosis,
                  notes: consultationForm.notes
                } : undefined
              }
            : ticket
        ));
      }
      
      // Close modal
      setIsConsultationModalOpen(false);
      setSelectedTicket(null);
      setConsultationForm({
        chief_complaint: '',
        diagnosis: '',
        notes: '',
        next_appointment_date: '',
        next_appointment_reason: ''
      });

    } catch (error: any) {
      console.error('Error saving consultation:', error);
      toast.error(error.message || 'ไม่สามารถบันทึกข้อมูลการตรวจได้');
    } finally {
      setIsSavingConsultation(false);
    }
  };

  const getStatusCounts = (tickets: DoctorTicket[]) => {
    const counts = {
      waiting: 0,
      called: 0,
      in_service: 0,
      done: 0,
      cancelled: 0,
      total: tickets.length
    };
    
    tickets.forEach(ticket => {
      if (counts.hasOwnProperty(ticket.status)) {
        counts[ticket.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  const getTicketsByStatus = (status: string) => {
    return doctorTickets.filter(ticket => ticket.status === status);
  };

  const getFilteredTickets = () => {
    let filtered = doctorTickets;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.patient?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.patient?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.patient?.phone?.includes(searchQuery) ||
        ticket.patientId.includes(searchQuery)
      );
    }
    
    return filtered;
  };

  const renderTicketCard = (ticket: DoctorTicket) => {
    const config = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.waiting;
    const Icon = config.icon;

    return (
      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="font-semibold">#{ticket.number}</span>
              <Badge className={config.color}>
                {config.label}
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              {format(new Date(ticket.created_at), 'HH:mm')}
            </span>
          </div>
          
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900">
              {ticket.patient?.first_name} {ticket.patient?.last_name}
            </h4>
            {ticket.patient?.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {ticket.patient.phone}
              </p>
            )}
            {ticket.visit?.chief_complaint && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>อาการสำคัญ:</strong> {ticket.visit.chief_complaint}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {ticket.status === 'waiting' && (
              <Button
                size="sm"
                onClick={() => callTicket(ticket.id)}
                disabled={isUpdating === ticket.id}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Phone className="w-3 h-3 mr-1" />
เรียก
              </Button>
            )}
            
            {ticket.status === 'called' && (
              <Button
                size="sm"
                onClick={() => startTicket(ticket.id)}
                disabled={isUpdating === ticket.id}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Play className="w-3 h-3 mr-1" />
เริ่มตรวจ
              </Button>
            )}
            
            {ticket.status === 'in_service' && (
              <>
                {ticket.visit && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openVitalsModal(ticket)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Stethoscope className="w-3 h-3 mr-1" />
ดูสัญญาณชีพ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openConsultationModal(ticket)}
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      บันทึกการตรวจ
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={() => completeTicket(ticket.id)}
                  disabled={isUpdating === ticket.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
เสร็จสิ้น
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const counts = getStatusCounts(doctorTickets);
  const filteredTickets = getFilteredTickets();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageGuard requiredPermission="queue/doctor">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">คิวหมอ</h1>
            <p className="text-gray-600 mt-1">จัดการคิวการตรวจแพทย์</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchDoctorQueue}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
รีเฟรช
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาตามชื่อ เบอร์โทร หรือ ID ผู้ป่วย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">รอเรียก</p>
                  <p className="text-2xl font-bold text-blue-600">{counts.waiting}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">เรียกแล้ว</p>
                  <p className="text-2xl font-bold text-yellow-600">{counts.called}</p>
                </div>
                <Phone className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">กำลังตรวจ</p>
                  <p className="text-2xl font-bold text-teal-600">{counts.in_service}</p>
                </div>
                <Activity className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-green-600">{counts.done}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ยกเลิก</p>
                  <p className="text-2xl font-bold text-red-600">{counts.cancelled}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">ทั้งหมด ({counts.total})</TabsTrigger>
            <TabsTrigger value="waiting">รอเรียก ({counts.waiting})</TabsTrigger>
            <TabsTrigger value="called">เรียกแล้ว ({counts.called})</TabsTrigger>
            <TabsTrigger value="in_service">กำลังตรวจ ({counts.in_service})</TabsTrigger>
            <TabsTrigger value="done">เสร็จสิ้น ({counts.done})</TabsTrigger>
            <TabsTrigger value="cancelled">ยกเลิก ({counts.cancelled})</TabsTrigger>
          </TabsList>
          
          {/* All Tickets */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTickets
                .sort((a, b) => {
                  // Sort by priority (high to low), then by number (low to high)
                  if (a.priority !== b.priority) return b.priority - a.priority;
                  return a.number - b.number;
                })
                .map(renderTicketCard)}
            </div>
          </TabsContent>
          
          {/* Individual Status Tabs */}
          {Object.keys(statusConfig).map((status) => (
            <TabsContent key={status} value={status} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getTicketsByStatus(status)
                  .sort((a, b) => {
                    // Sort by priority (high to low), then by number (low to high)
                    if (a.priority !== b.priority) return b.priority - a.priority;
                    return a.number - b.number;
                  })
                  .map(renderTicketCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Vitals Modal */}
        <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
สัญญาณชีพผู้ป่วย - {selectedTicket?.patient?.first_name} {selectedTicket?.patient?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTicket?.visit?.vitals && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">ส่วนสูง</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.heightCm || 'N/A'} cm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Weight className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">น้ำหนัก</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.weightKg || 'N/A'} kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">อุณหภูมิ</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.tempC || 'N/A'} °C</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <Heart className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">อัตราการเต้นของหัวใจ</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.hr || 'N/A'} bpm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">ความดันโลหิต</p>
                      <p className="font-semibold">
                        {selectedTicket.visit.vitals.sbp && selectedTicket.visit.vitals.dbp 
                          ? `${selectedTicket.visit.vitals.sbp}/${selectedTicket.visit.vitals.dbp} mmHg`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
                    <Zap className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="text-sm text-gray-600">SpO2</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.spo2 || 'N/A'} %</p>
                    </div>
                  </div>
                </div>
                
                {selectedTicket.visit.vitals.bmi && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">BMI</p>
                    <p className="font-semibold text-lg">{selectedTicket.visit.vitals.bmi.toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsVitalsModalOpen(false)}
                    className="flex-1"
                  >
ปิด
                  </Button>
                </div>
              </div>
            )}
            
            {!selectedTicket?.visit?.vitals && (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">ยังไม่มีข้อมูลสัญญาณชีพ</p>
                <Button
                  variant="outline"
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Doctor Consultation Modal */}
        <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                บันทึกการตรวจ - {selectedTicket?.patient?.first_name} {selectedTicket?.patient?.last_name}
                {existingConsultation && (existingConsultation.chief_complaint || existingConsultation.diagnosis || existingConsultation.notes || existingConsultation.appointment) && (
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                    มีข้อมูลแล้ว
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {isLoadingConsultation && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-sm text-gray-600">กำลังโหลดข้อมูลการตรวจ...</span>
                </div>
              )}
              
              {existingConsultation && !isLoadingConsultation && (existingConsultation.chief_complaint || existingConsultation.diagnosis || existingConsultation.notes || existingConsultation.appointment) && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    พบข้อมูลการตรวจที่บันทึกไว้แล้ว สามารถแก้ไขได้
                  </p>
                  {existingConsultation.appointment && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800 font-medium">นัดหมายครั้งต่อไป:</p>
                      <p className="text-xs text-blue-700">
                        {format(new Date(existingConsultation.appointment.appointment_time), 'dd/MM/yyyy HH:mm')} - {existingConsultation.appointment.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="chief_complaint" className="text-sm font-medium">
                  อาการสำคัญ (Chief Complaint)
                </Label>
                <Textarea
                  id="chief_complaint"
                  placeholder="กรุณาระบุอาการสำคัญที่ผู้ป่วยมาพบแพทย์..."
                  value={consultationForm.chief_complaint}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnosis" className="text-sm font-medium">
                  การวินิจฉัย (Diagnosis)
                </Label>
                <Textarea
                  id="diagnosis"
                  placeholder="กรุณาระบุการวินิจฉัยโรค..."
                  value={consultationForm.diagnosis}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  แผนการรักษา (Treatment Plan)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="กรุณาระบุแผนการรักษา แนวทางการให้ยา และคำแนะนำ..."
                  value={consultationForm.notes}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              {/* Next Appointment Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">นัดหมายครั้งต่อไป (ถ้ามี)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="next_appointment_date" className="text-sm font-medium">
                      วันที่นัดหมาย
                    </Label>
                    <Input
                      id="next_appointment_date"
                      type="date"
                      value={consultationForm.next_appointment_date}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, next_appointment_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="next_appointment_reason" className="text-sm font-medium">
                      เหตุผลการนัดหมาย
                    </Label>
                    <Input
                      id="next_appointment_reason"
                      placeholder="เช่น ติดตามผลการรักษา, ตรวจเลือด..."
                      value={consultationForm.next_appointment_reason}
                      onChange={(e) => setConsultationForm(prev => ({ ...prev, next_appointment_reason: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveConsultation}
                  disabled={isSavingConsultation || isLoadingConsultation}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingConsultation ? 'กำลังบันทึก...' : 
                   existingConsultation && (existingConsultation.chief_complaint || existingConsultation.diagnosis || existingConsultation.notes || existingConsultation.appointment) ? 'อัปเดตการตรวจ' : 
                   'บันทึกการตรวจ'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsConsultationModalOpen(false)}
                  disabled={isSavingConsultation || isLoadingConsultation}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
