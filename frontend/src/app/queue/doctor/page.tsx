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
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';

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
  waiting: { label: 'Waiting', color: 'bg-blue-100 text-blue-800', icon: Clock },
  called: { label: 'Called', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  in_service: { label: 'In Service', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: CheckCircle },
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
        station: 'doctor',
        status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
        pagination: { take: 100 }
      });
      
      setDoctorTickets(result.queueTickets || []);

    } catch (error: any) {
      console.error('Error fetching doctor queue:', error);
      toast.error(error.message || 'Failed to load doctor queue');
    } finally {
      setIsLoading(false);
    }
  };

  const callTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'called');
      toast.success('Patient called');
      fetchDoctorQueue(); // Refresh data

    } catch (error: any) {
      console.error('Error calling ticket:', error);
      toast.error(error.message || 'Failed to call patient');
    } finally {
      setIsUpdating(null);
    }
  };

  const startTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'in_service');
      toast.success('Doctor consultation started');
      fetchDoctorQueue(); // Refresh data

    } catch (error: any) {
      console.error('Error starting ticket:', error);
      toast.error(error.message || 'Failed to start consultation');
    } finally {
      setIsUpdating(null);
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'done');
      toast.success('Doctor consultation completed');
      fetchDoctorQueue(); // Refresh data

    } catch (error: any) {
      console.error('Error completing ticket:', error);
      toast.error(error.message || 'Failed to complete consultation');
    } finally {
      setIsUpdating(null);
    }
  };

  const openVitalsModal = (ticket: DoctorTicket) => {
    setSelectedTicket(ticket);
    setIsVitalsModalOpen(true);
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
                <strong>Chief Complaint:</strong> {ticket.visit.chief_complaint}
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
                Call
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
                Start Consultation
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
                  >
                    <Stethoscope className="w-3 h-3 mr-1" />
                    View Vitals
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => completeTicket(ticket.id)}
                  disabled={isUpdating === ticket.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
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
            <h1 className="text-3xl font-bold text-gray-900">Doctor Queue</h1>
            <p className="text-gray-600 mt-1">Manage doctor consultation queue</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchDoctorQueue}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by patient name, phone, or ID..."
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
                  <p className="text-sm font-medium text-gray-600">Waiting</p>
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
                  <p className="text-sm font-medium text-gray-600">Called</p>
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
                  <p className="text-sm font-medium text-gray-600">In Service</p>
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
                  <p className="text-sm font-medium text-gray-600">Completed</p>
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
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
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
            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
            <TabsTrigger value="waiting">Waiting ({counts.waiting})</TabsTrigger>
            <TabsTrigger value="called">Called ({counts.called})</TabsTrigger>
            <TabsTrigger value="in_service">In Service ({counts.in_service})</TabsTrigger>
            <TabsTrigger value="done">Done ({counts.done})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
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
                Patient Vitals - {selectedTicket?.patient?.first_name} {selectedTicket?.patient?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTicket?.visit?.vitals && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Height</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.heightCm || 'N/A'} cm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Weight className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.weightKg || 'N/A'} kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.tempC || 'N/A'} °C</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <Heart className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Heart Rate</p>
                      <p className="font-semibold">{selectedTicket.visit.vitals.hr || 'N/A'} bpm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Blood Pressure</p>
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
                    Close
                  </Button>
                </div>
              </div>
            )}
            
            {!selectedTicket?.visit?.vitals && (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No vitals recorded yet</p>
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
      </div>
    </PageGuard>
  );
}
