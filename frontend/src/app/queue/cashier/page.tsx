'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ShoppingCart,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';
import { useRouter } from 'next/navigation';
import { useCacheContext } from '@/hooks/useCacheContext';

interface CashierTicket {
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
    appointment?: {
      id: string;
      appointment_time: string;
      reason: string;
      status: string;
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
  in_service: { label: 'กำลังบริการ', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800', icon: CheckCircle },
};

export default function CashierQueuePage() {
  const router = useRouter();
  const [cashierTickets, setCashierTickets] = useState<CashierTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Cache context management
  const { currentContext } = useCacheContext();

  useEffect(() => {
    fetchCashierQueue();
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      // Skip polling if any ticket is being updated
      if (!isUpdating) {
        fetchCashierQueue();
      }
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedStatus, isUpdating]); // Added isUpdating to dependencies

  const fetchCashierQueue = async (skipCache = false) => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getQueueTickets({
        station: 'cashier',
        status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
        pagination: { take: 100 }
      }, skipCache);
      
      setCashierTickets(result.queueTickets || []);

    } catch (error: any) {
      console.error('Error fetching cashier queue:', error);
      toast.error(error.message || 'ไม่สามารถโหลดคิวแคชเชียร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const callTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'called');
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchCashierQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setCashierTickets(prev => prev.map(ticket => 
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
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchCashierQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setCashierTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'in_service', started_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('เริ่มบริการแคชเชียร์แล้ว');

    } catch (error: any) {
      console.error('Error starting ticket:', error);
      toast.error(error.message || 'ไม่สามารถเริ่มบริการแคชเชียร์ได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'done');
      
      // Force refresh with fresh data (skip cache)
      setTimeout(() => {
        fetchCashierQueue(true); // Pass skipCache = true
      }, 100);
      
      // Update state immediately
      setCashierTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'done', done_at: new Date().toISOString() }
          : ticket
      ));
      
      toast.success('บริการแคชเชียร์เสร็จสิ้น');

    } catch (error: any) {
      console.error('Error completing ticket:', error);
      toast.error(error.message || 'ไม่สามารถเสร็จสิ้นบริการแคชเชียร์ได้');
    } finally {
      setIsUpdating(null);
    }
  };

  const openPOS = async (ticket: CashierTicket) => {
    try {
      // Fetch patient data to get medical information
      const patientResult = await GraphQLAPI.getPatient(ticket.patientId);
      const patientData = patientResult.patient;
      
      // Navigate to POS page with visit data
      const visitData = {
        visitId: ticket.visit?.id,
        patientId: ticket.patientId,
        patientName: `${ticket.patient?.first_name} ${ticket.patient?.last_name}`,
        patientPhone: ticket.patient?.phone,
        patientEmail: ticket.patient?.email,
        visitData: ticket.visit,
        patientData: patientData // Add patient data with medical information
      };
      
      // Store visit data in sessionStorage for POS page to use
      sessionStorage.setItem('prescriptionVisitData', JSON.stringify(visitData));
      
      // Navigate to POS page
      router.push('/dashboard/pos');
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
    }
  };


  const getStatusCounts = (tickets: CashierTicket[]) => {
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
    return cashierTickets.filter(ticket => ticket.status === status);
  };

  const getFilteredTickets = () => {
    let filtered = cashierTickets;
    
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

  const renderTicketCard = (ticket: CashierTicket) => {
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
            {ticket.visit?.diagnosis && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>การวินิจฉัย:</strong> {ticket.visit.diagnosis}
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
เริ่มบริการ
              </Button>
            )}
            
            {ticket.status === 'in_service' && (
              <>
                {ticket.visit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPOS(ticket)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
เปิด POS
                  </Button>
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

  const counts = getStatusCounts(cashierTickets);
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
    <PageGuard requiredPermission="queue/cashier">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">คิวแคชเชียร์</h1>
            <p className="text-gray-600 mt-1">จัดการคิวบริการแคชเชียร์</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchCashierQueue()}
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
                  <p className="text-sm font-medium text-gray-600">กำลังบริการ</p>
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
            <TabsTrigger value="in_service">กำลังบริการ ({counts.in_service})</TabsTrigger>
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

      </div>
    </PageGuard>
  );
}
