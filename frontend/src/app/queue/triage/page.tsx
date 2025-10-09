'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  Phone, 
  Play, 
  CheckCircle, 
  RefreshCw,
  Activity,
  Plus,
  Search,
  UserPlus,
  Stethoscope,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Zap,
  Save,
  User,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';
import { QUEUE_TICKET_STATUS, QUEUE_TICKET_STATION } from '@/constants';
import { useCacheContext } from '@/hooks/useCacheContext';

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
  visit?: {
    id: string;
    status: string;
    chief_complaint?: string;
    diagnosis?: string;
    notes?: string;
    vitals?: {
      id: string;
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
      created_at: string;
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

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

const statusConfig = {
  waiting: { label: 'รอเรียก', color: 'bg-blue-100 text-blue-800', icon: Clock },
  called: { label: 'เรียกแล้ว', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  in_service: { label: 'กำลังคัดกรอง', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function TriageQueuePage() {
  const [triageTickets, setTriageTickets] = useState<TriageTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cache context management
  const { currentContext } = useCacheContext();
  
  // Vitals modal states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TriageTicket | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    heightCm: '',
    weightKg: '',
    tempC: '',
    sbp: '',
    dbp: '',
    hr: '',
    rr: '',
    spo2: ''
  });
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [existingVitals, setExistingVitals] = useState<any>(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  useEffect(() => {
    fetchTriageQueue();
    // Set up polling for real-time updates with longer interval to avoid rate limiting
    const interval = setInterval(() => {
      // Skip polling if any ticket is being updated
      if (!isUpdating) {
        fetchTriageQueue();
      }
    }, 60000); // Refresh every 60 seconds (increased from 30 seconds)
    return () => clearInterval(interval);
  }, [selectedStatus, searchQuery, isUpdating]);

  const fetchTriageQueue = async (skipCache = false) => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getQueueTickets({
        station: QUEUE_TICKET_STATION.TRIAGE,
        status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
        pagination: { take: 100 }
      }, skipCache);
      
      let tickets = result.queueTickets || [];
      
      // Apply search filter on frontend since getQueueTickets doesn't support search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        tickets = tickets.filter(ticket => 
          ticket.patient.first_name.toLowerCase().includes(query) ||
          ticket.patient.last_name.toLowerCase().includes(query) ||
          ticket.patient.phone?.includes(query) ||
          ticket.number.toString().includes(query)
        );
      }
      
      setTriageTickets(tickets);

    } catch (error: any) {
      console.error('Error fetching triage queue:', error);
      
      // Handle rate limiting specifically
      if (error.message?.includes('Rate limit exceeded') || error.message?.includes('Request too frequent')) {
        toast.error('การเรียกข้อมูลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
        // Extend polling interval temporarily
        setTimeout(() => {
          fetchTriageQueue(true);
        }, 30000); // Wait 30 seconds before retry
      } else {
        toast.error(error.message || 'ไม่สามารถโหลดคิวคัดกรองได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const result = await GraphQLAPI.searchPatients(query);
      setSearchResults(result.searchPatients || []);
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast.error('ไม่สามารถค้นหาผู้ป่วยได้');
    } finally {
      setIsSearching(false);
    }
  };

  const createTriageTicket = async (patientId: string, priority: number = 0) => {
    try {
      setIsUpdating('creating');
      
      const result = await GraphQLAPI.createTriageTicket(patientId, priority);
      
      // If we get the created ticket back, add it to state immediately
      if (result && result.createTriageTicket) {
        const newTicket = result.createTriageTicket;
        setTriageTickets(prev => [newTicket, ...prev]);
      } else {
        // Fallback to refresh if we don't get the ticket back
        fetchTriageQueue();
      }
      
      toast.success('สร้างตั๋วคัดกรองสำเร็จ');
      setIsCreateModalOpen(false);
      setPatientSearchQuery('');
      setSearchResults([]);

    } catch (error: any) {
      console.error('Error creating triage ticket:', error);
      if (error.message?.includes('DUPLICATE_TRIAGE_TICKET_TODAY')) {
        toast.error('ผู้ป่วยมีตั๋วคัดกรองที่ใช้งานอยู่แล้ววันนี้');
      } else {
        toast.error(error.message || 'ไม่สามารถสร้างตั๋วคัดกรองได้');
      }
    } finally {
      setIsUpdating(null);
    }
  };

  const callTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.queueCall(ticketId);
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchTriageQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setTriageTickets(prev => prev.map(ticket => 
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
      
      await GraphQLAPI.queueStart(ticketId);
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchTriageQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setTriageTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'in_service', started_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('เริ่มบริการคัดกรองแล้ว');

    } catch (error: any) {
      console.error('Error starting ticket:', error);
      toast.error(error.message || 'ไม่สามารถเริ่มบริการคัดกรองได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.queueComplete(ticketId);
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchTriageQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setTriageTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'done', done_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('บริการคัดกรองเสร็จสิ้น');

    } catch (error: any) {
      console.error('Error completing ticket:', error);
      toast.error(error.message || 'ไม่สามารถเสร็จสิ้นบริการคัดกรองได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const fetchExistingVitals = async (visitId: string) => {
    try {
      setIsLoadingVitals(true);
      const result = await GraphQLAPI.getVisit(visitId);
      return {
        vitals: result.visit?.vitals || null,
        queueTickets: result.visit?.queueTickets || []
      };
    } catch (error: any) {
      console.error('Error fetching existing vitals:', error);
      return { vitals: null, queueTickets: [] };
    } finally {
      setIsLoadingVitals(false);
    }
  };

  const openVitalsModal = async (ticket: TriageTicket) => {
    setSelectedTicket(ticket);
    setIsVitalsModalOpen(true);
    
    // Reset form first
    setVitalsForm({
      heightCm: '',
      weightKg: '',
      tempC: '',
      sbp: '',
      dbp: '',
      hr: '',
      rr: '',
      spo2: ''
    });
    setExistingVitals(null);
    
    // Fetch existing vitals if visit exists
    if (ticket.visit?.id) {
      const existingData = await fetchExistingVitals(ticket.visit.id);
      if (existingData.vitals) {
        // Only set existingVitals if there are actual vitals data
        setExistingVitals({
          ...existingData.vitals,
          queueTickets: existingData.queueTickets
        });
        // Populate form with existing data
        setVitalsForm({
          heightCm: existingData.vitals.heightCm?.toString() || '',
          weightKg: existingData.vitals.weightKg?.toString() || '',
          tempC: existingData.vitals.tempC?.toString() || '',
          sbp: existingData.vitals.sbp?.toString() || '',
          dbp: existingData.vitals.dbp?.toString() || '',
          hr: existingData.vitals.hr?.toString() || '',
          rr: existingData.vitals.rr?.toString() || '',
          spo2: existingData.vitals.spo2?.toString() || ''
        });
      } else {
        // If no vitals but we have queue tickets, store only queue tickets for later use
        setExistingVitals({
          queueTickets: existingData.queueTickets
        });
      }
    }
  };

  const handleSaveVitals = async () => {
    if (!selectedTicket?.visit) {
      toast.error('ไม่พบข้อมูลการมาเยี่ยมสำหรับตั๋วนี้');
      return;
    }

    try {
      setIsSavingVitals(true);
      
      const vitalsData: any = { visitId: selectedTicket.visit.id };
      
      // Convert string values to numbers where applicable
      Object.entries(vitalsForm).forEach(([key, value]) => {
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            vitalsData[key] = key.includes('bp') || key === 'hr' || key === 'rr' || key === 'spo2' 
              ? Math.round(numValue) : numValue;
          }
        }
      });
      
      await GraphQLAPI.upsertVitals(vitalsData);
      toast.success('บันทึกสัญญาณชีพสำเร็จ!');
      
      // Check if doctor queue ticket already exists
      const hasDoctorQueueTicket = existingVitals?.queueTickets?.some(
        (ticket: any) => ticket.station === QUEUE_TICKET_STATION.DOCTOR && ticket.status !== QUEUE_TICKET_STATUS.DONE && ticket.status !== QUEUE_TICKET_STATUS.CANCELLED
      );
      
      if (!hasDoctorQueueTicket) {
        // Create doctor queue ticket only if it doesn't exist
        try {
          await GraphQLAPI.createQueueTicket({
            visitId: selectedTicket.visit.id,
            station: QUEUE_TICKET_STATION.DOCTOR
          });
          toast.success('ส่งผู้ป่วยไปคิวหมอเพื่อประเมิน SOAP');
        } catch (error: any) {
          // If ticket already exists (race condition), that's fine
          if (error.message?.includes('Active queue ticket already exists')) {
            toast.success('อัปเดตสัญญาณชีพสำเร็จ! ผู้ป่วยอยู่ในคิวหมอแล้ว');
          } else {
            throw error; // Re-throw if it's a different error
          }
        }
      } else {
        toast.success('อัปเดตสัญญาณชีพสำเร็จ! ผู้ป่วยอยู่ในคิวหมอแล้ว');
      }
      
      // Update the selected ticket with vitals data
      if (selectedTicket) {
        // Update local state immediately
        setTriageTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                visit: ticket.visit ? {
                  ...ticket.visit,
                  vitals: {
                    ...(ticket.visit.vitals || {}),
                    ...vitalsData
                  }
                } : undefined
              }
            : ticket
        ));
        
        // Force refresh with fresh data (skip cache)
        setTimeout(() => {
          fetchTriageQueue(true); // Pass skipCache = true
        }, 100);
      }
      
      // Close modal
      setIsVitalsModalOpen(false);
      setSelectedTicket(null);

    } catch (error: any) {
      console.error('Error saving vitals:', error);
      toast.error(error.message || 'ไม่สามารถบันทึกสัญญาณชีพได้');
    } finally {
      setIsSavingVitals(false);
    }
  };

  const getStatusCounts = (tickets: TriageTicket[]) => {
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
    return triageTickets.filter(ticket => ticket.status === status);
  };

  const renderTicketCard = (ticket: TriageTicket) => {
    const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.waiting;
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card key={ticket.id} className="hover:shadow-md transition-shadow" data-testid={`ticket-card-${ticket.patient.phone}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">#{ticket.number}</span>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {ticket.priority > 0 && (
                <Badge variant="destructive">Priority</Badge>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {format(new Date(ticket.created_at), 'HH:mm')}
            </span>
          </div>
          
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900">
              {ticket.patient.first_name} {ticket.patient.last_name}
            </h4>
            {ticket.patient.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {ticket.patient.phone}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {ticket.status === 'waiting' && (
              <Button
                size="sm"
                onClick={() => callTicket(ticket.id)}
                disabled={isUpdating === ticket.id}
                className="bg-yellow-600 hover:bg-yellow-700"
                data-testid={`call-button-${ticket.patient.phone}`}
              >
                <Phone className="w-3 h-3 mr-1" />
เรียก
              </Button>
            )}
            
            {['waiting', 'called'].includes(ticket.status) && (
              <Button
                size="sm"
                onClick={() => startTicket(ticket.id)}
                disabled={isUpdating === ticket.id}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid={`start-button-${ticket.patient.phone}`}
              >
                <Play className="w-3 h-3 mr-1" />
เริ่มคัดกรอง
              </Button>
            )}
            
            {ticket.status === 'in_service' && (
              <>
                {ticket.visit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openVitalsModal(ticket)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    data-testid={`vitals-button-${ticket.patient.phone}`}
                  >
                    <Stethoscope className="w-3 h-3 mr-1" />
บันทึกสัญญาณชีพ
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => completeTicket(ticket.id)}
                  disabled={isUpdating === ticket.id}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid={`complete-button-${ticket.patient.phone}`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
เสร็จสิ้น
                </Button>
              </>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="mt-3 pt-2 border-t text-xs text-gray-500 space-y-1">
            {ticket.called_at && (
              <div>เรียก: {format(new Date(ticket.called_at), 'HH:mm:ss')}</div>
            )}
            {ticket.started_at && (
              <div>เริ่ม: {format(new Date(ticket.started_at), 'HH:mm:ss')}</div>
            )}
            {ticket.done_at && (
              <div>เสร็จ: {format(new Date(ticket.done_at), 'HH:mm:ss')}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const counts = getStatusCounts(triageTickets);

  return (
    <PageGuard requiredPermission="queue/triage">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">คิวคัดกรอง</h1>
          <div className="flex gap-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
สร้างตั๋ว
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>สร้างตั๋วคัดกรอง</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">ค้นหาผู้ป่วย</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="ค้นหาตามชื่อ เบอร์โทร หรือ ID..."
                        value={patientSearchQuery}
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value);
                          searchPatients(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => createTriageTicket(patient.id)}
                        >
                          <div className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </div>
                          {patient.phone && (
                            <div className="text-sm text-gray-600">{patient.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isSearching && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => fetchTriageQueue()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาผู้ป่วย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                  <p className="text-sm font-medium text-gray-600">กำลังคัดกรอง</p>
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
                <XCircle className="h-8 w-8 text-red-600" />
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
            <TabsTrigger value="in_service">กำลังคัดกรอง ({counts.in_service})</TabsTrigger>
            <TabsTrigger value="done">เสร็จสิ้น ({counts.done})</TabsTrigger>
            <TabsTrigger value="cancelled">ยกเลิก ({counts.cancelled})</TabsTrigger>
          </TabsList>
          
          {/* All Tickets */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {triageTickets
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
      </div>

      {/* Vitals Modal */}
      <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              บันทึกสัญญาณชีพ - {selectedTicket?.patient.first_name} {selectedTicket?.patient.last_name}
              {existingVitals && existingVitals.heightCm && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                  มีข้อมูลแล้ว
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingVitals && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-600">กำลังโหลดข้อมูลสัญญาณชีพ...</span>
              </div>
            )}
            
            {existingVitals && existingVitals.heightCm && !isLoadingVitals && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  พบข้อมูลสัญญาณชีพที่บันทึกไว้แล้ว สามารถแก้ไขได้
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heightCm" className="flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
ส่วนสูง (ซม.)
                </Label>
                <Input
                  id="heightCm"
                  type="number"
                  value={vitalsForm.heightCm}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, heightCm: e.target.value }))}
                  placeholder="170"
                />
              </div>
              
              <div>
                <Label htmlFor="weightKg" className="flex items-center gap-1">
                  <Weight className="w-4 h-4" />
น้ำหนัก (กก.)
                </Label>
                <Input
                  id="weightKg"
                  type="number"
                  value={vitalsForm.weightKg}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, weightKg: e.target.value }))}
                  placeholder="70"
                />
              </div>
              
              <div>
                <Label htmlFor="tempC" className="flex items-center gap-1">
                  <Thermometer className="w-4 h-4" />
อุณหภูมิ (°C)
                </Label>
                <Input
                  id="tempC"
                  type="number"
                  step="0.1"
                  value={vitalsForm.tempC}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, tempC: e.target.value }))}
                  placeholder="36.5"
                />
              </div>
              
              <div>
                <Label htmlFor="hr" className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
อัตราการเต้นของหัวใจ (bpm)
                </Label>
                <Input
                  id="hr"
                  type="number"
                  value={vitalsForm.hr}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, hr: e.target.value }))}
                  placeholder="72"
                />
              </div>
              
              <div>
                <Label htmlFor="sbp">SBP (mmHg)</Label>
                <Input
                  id="sbp"
                  type="number"
                  value={vitalsForm.sbp}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, sbp: e.target.value }))}
                  placeholder="120"
                />
              </div>
              
              <div>
                <Label htmlFor="dbp">DBP (mmHg)</Label>
                <Input
                  id="dbp"
                  type="number"
                  value={vitalsForm.dbp}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, dbp: e.target.value }))}
                  placeholder="80"
                />
              </div>
              
              <div>
                <Label htmlFor="rr">Respiratory Rate</Label>
                <Input
                  id="rr"
                  type="number"
                  value={vitalsForm.rr}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, rr: e.target.value }))}
                  placeholder="20"
                />
              </div>
              
              <div>
                <Label htmlFor="spo2" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
SpO2 (%)
                </Label>
                <Input
                  id="spo2"
                  type="number"
                  value={vitalsForm.spo2}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, spo2: e.target.value }))}
                  placeholder="98"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveVitals}
                disabled={isSavingVitals || isLoadingVitals}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingVitals ? 'กำลังบันทึก...' : 
                 (existingVitals && existingVitals.heightCm) ? 'อัปเดตสัญญาณชีพ & ส่งคิวหมอ' : 
                 'บันทึกสัญญาณชีพ & ส่งคิวหมอ'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsVitalsModalOpen(false)}
                disabled={isSavingVitals || isLoadingVitals}
              >
ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageGuard>
  );
}
