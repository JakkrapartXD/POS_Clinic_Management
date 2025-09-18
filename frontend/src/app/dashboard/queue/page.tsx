'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  Phone, 
  Eye, 
  Play, 
  CheckCircle, 
  XCircle, 
  SkipForward,
  RefreshCw,
  Activity,
  Stethoscope,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';

interface QueueTicket {
  id: string;
  number: number;
  station: string;
  status: string;
  priority: number;
  called_at?: string;
  started_at?: string;
  done_at?: string;
  created_at: string;
  visit?: {
    id: string;
    chief_complaint?: string;
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      national_id?: string;
      phone?: string;
    };
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
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    national_id?: string;
    phone?: string;
  };
}

const stations = [
  { value: 'triage', label: 'Triage', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'doctor', label: 'Doctor', color: 'bg-teal-100 text-teal-800' },
  { value: 'pharmacy', label: 'Pharmacy', color: 'bg-green-100 text-green-800' },
  { value: 'cashier', label: 'Cashier', color: 'bg-orange-100 text-orange-800' }
];

const statusConfig = {
  waiting: { label: 'Waiting', color: 'bg-blue-100 text-blue-800', icon: Clock },
  called: { label: 'Called', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  in_service: { label: 'In Service', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  skipped: { label: 'Skipped', color: 'bg-gray-100 text-gray-800', icon: SkipForward },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function QueueManagementPage() {
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // Vitals modal states
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(null);
  const [previousVitals, setPreviousVitals] = useState<any[]>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);

  useEffect(() => {
    fetchQueueData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchQueueData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedStation, selectedStatus]);

  const fetchQueueData = async () => {
    try {
      setIsLoading(true);
      
      const variables: any = {
        pagination: { take: 100 }
      };
      
      if (selectedStation !== 'all') {
        variables.station = selectedStation.toUpperCase();
      }
      
      if (selectedStatus !== 'all') {
        variables.status = selectedStatus.toUpperCase();
      }
      
      const result = await GraphQLAPI.getQueueTickets(variables);
      setQueueTickets(result.queueTickets || []);

    } catch (error: any) {
      console.error('Error fetching queue data:', error);
      toast.error(error.message || 'Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQueueStatus = async (ticketId: string, newStatus: string, note?: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, newStatus, note);
      toast.success(`Queue status updated to ${newStatus}`);
      fetchQueueData(); // Refresh data

    } catch (error: any) {
      console.error('Error updating queue status:', error);
      toast.error(error.message || 'Failed to update queue status');
    } finally {
      setIsUpdating(null);
    }
  };

  const openVitalsModal = async (ticket: QueueTicket) => {
    setSelectedTicket(ticket);
    setIsVitalsModalOpen(true);
    
    // Debug current vitals
    console.log('Selected Ticket:', ticket);
    console.log('Current Vitals:', ticket.visit?.vitals);
    
    // Fetch previous vitals for this patient
    if (ticket.visit?.patient?.id) {
      try {
        setIsLoadingVitals(true);
        const result = await GraphQLAPI.getPatientVitals(ticket.visit.patient.id);
        console.log('Patient Vitals Response:', result);
        console.log('Patient Vitals Array:', result.patientVitals);
        setPreviousVitals(result.patientVitals || []);
      } catch (error: any) {
        console.error('Error fetching previous vitals:', error);
        setPreviousVitals([]);
      } finally {
        setIsLoadingVitals(false);
      }
    }
  };

  const getStationTickets = (station: string) => {
    return queueTickets.filter(ticket => ticket.station.toLowerCase() === station.toLowerCase());
  };

  const getStatusCounts = (tickets: QueueTicket[]) => {
    const counts = {
      waiting: 0,
      called: 0,
      in_service: 0,
      done: 0,
      total: tickets.length
    };
    
    tickets.forEach(ticket => {
      if (counts.hasOwnProperty(ticket.status)) {
        counts[ticket.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  const renderTicketCard = (ticket: QueueTicket) => {
    const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.waiting;
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
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
              {ticket.visit?.patient?.first_name || ticket.patient?.first_name} {ticket.visit?.patient?.last_name || ticket.patient?.last_name}
            </h4>
            {(ticket.visit?.patient?.phone || ticket.patient?.phone) && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {ticket.visit?.patient?.phone || ticket.patient?.phone}
              </p>
            )}
            {ticket.visit?.chief_complaint && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Chief Complaint:</strong> {ticket.visit.chief_complaint}
              </p>
            )}
            {ticket.station === 'triage' && !ticket.visit && (
              <p className="text-sm text-blue-600 mt-1">
                <strong>Triage Queue</strong>
              </p>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {ticket.status === 'waiting' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateQueueStatus(ticket.id, 'called')}
                  disabled={isUpdating === ticket.id}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQueueStatus(ticket.id, 'skipped')}
                  disabled={isUpdating === ticket.id}
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip
                </Button>
              </>
            )}
            
            {ticket.status === 'called' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateQueueStatus(ticket.id, 'in_service')}
                  disabled={isUpdating === ticket.id}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start Service
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQueueStatus(ticket.id, 'waiting')}
                  disabled={isUpdating === ticket.id}
                >
                  Back to Queue
                </Button>
              </>
            )}
            
            {ticket.status === 'in_service' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateQueueStatus(ticket.id, 'done')}
                  disabled={isUpdating === ticket.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQueueStatus(ticket.id, 'called')}
                  disabled={isUpdating === ticket.id}
                >
                  Back to Called
                </Button>
              </>
            )}
            
            {['waiting', 'called', 'in_service'].includes(ticket.status) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateQueueStatus(ticket.id, 'cancelled')}
                disabled={isUpdating === ticket.id}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
            
            {ticket.visit && ticket.status !== 'done' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openVitalsModal(ticket)}
              >
                <Eye className="w-3 h-3 mr-1" />
                View Vitals
              </Button>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="mt-3 pt-2 border-t text-xs text-gray-500 space-y-1">
            {ticket.called_at && (
              <div>Called: {format(new Date(ticket.called_at), 'HH:mm:ss')}</div>
            )}
            {ticket.started_at && (
              <div>Started: {format(new Date(ticket.started_at), 'HH:mm:ss')}</div>
            )}
            {ticket.done_at && (
              <div>Completed: {format(new Date(ticket.done_at), 'HH:mm:ss')}</div>
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

  return (
    <PageGuard requiredPermission="queue">
      <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
        <div className="flex gap-2">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Stations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              {stations.map((station) => (
                <SelectItem key={station.value} value={station.value}>
                  {station.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchQueueData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Station Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Stations</TabsTrigger>
          {stations.map((station) => (
            <TabsTrigger key={station.value} value={station.value}>
              {station.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* All Stations Overview */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stations.map((station) => {
              const stationTickets = getStationTickets(station.value);
              const counts = getStatusCounts(stationTickets);
              
              return (
                <Card key={station.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{station.label}</span>
                      <Badge className={station.color}>{counts.total}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Waiting:</span>
                        <Badge variant="outline">{counts.waiting}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>In Service:</span>
                        <Badge variant="outline">{counts.in_service}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Done Today:</span>
                        <Badge variant="outline">{counts.done}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* All Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {queueTickets
              .sort((a, b) => {
                // Sort by priority (high to low), then by number (low to high)
                if (a.priority !== b.priority) return b.priority - a.priority;
                return a.number - b.number;
              })
              .map(renderTicketCard)}
          </div>
        </TabsContent>
        
        {/* Individual Station Tabs */}
        {stations.map((station) => (
          <TabsContent key={station.value} value={station.value} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {station.label} Station
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const stationTickets = getStationTickets(station.value);
                  const counts = getStatusCounts(stationTickets);
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{counts.waiting}</div>
                        <div className="text-sm text-gray-600">Waiting</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{counts.called}</div>
                        <div className="text-sm text-gray-600">Called</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">{counts.in_service}</div>
                        <div className="text-sm text-gray-600">In Service</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{counts.done}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getStationTickets(station.value)
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
              Patient Vitals - {selectedTicket?.visit?.patient?.first_name} {selectedTicket?.visit?.patient?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket?.visit?.vitals && (
            <div className="space-y-4">
              {/* Current Vitals */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Current Vitals</h3>
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
              </div>
              
              {/* Previous Vitals */}
              {isLoadingVitals ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading previous vitals...</p>
                </div>
              ) : previousVitals.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-600">Previous Vitals</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {previousVitals.map((vital, index) => (
                      <div key={vital.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-700">
                            Visit #{vital.visit?.id?.slice(-8) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(vital.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                        {vital.visit?.chief_complaint && (
                          <div className="text-xs text-gray-600 mb-2">
                            Chief Complaint: {vital.visit.chief_complaint}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {vital.heightCm && (
                            <div className="text-center">
                              <div className="text-gray-500">Height</div>
                              <div className="font-medium">{vital.heightCm} cm</div>
                            </div>
                          )}
                          {vital.weightKg && (
                            <div className="text-center">
                              <div className="text-gray-500">Weight</div>
                              <div className="font-medium">{vital.weightKg} kg</div>
                            </div>
                          )}
                          {vital.tempC && (
                            <div className="text-center">
                              <div className="text-gray-500">Temp</div>
                              <div className="font-medium">{vital.tempC} °C</div>
                            </div>
                          )}
                          {vital.hr && (
                            <div className="text-center">
                              <div className="text-gray-500">HR</div>
                              <div className="font-medium">{vital.hr} bpm</div>
                            </div>
                          )}
                          {vital.sbp && vital.dbp && (
                            <div className="text-center">
                              <div className="text-gray-500">BP</div>
                              <div className="font-medium">{vital.sbp}/{vital.dbp}</div>
                            </div>
                          )}
                          {vital.spo2 && (
                            <div className="text-center">
                              <div className="text-gray-500">SpO2</div>
                              <div className="font-medium">{vital.spo2}%</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No previous vitals found</p>
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
            <div className="space-y-4">
              {/* No Current Vitals */}
              <div className="text-center py-4">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No current vitals recorded</p>
              </div>
              
              {/* Previous Vitals */}
              {isLoadingVitals ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading previous vitals...</p>
                </div>
              ) : previousVitals.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-600">Previous Vitals</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {previousVitals.map((vital, index) => (
                      <div key={vital.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-700">
                            Visit #{vital.visit?.id?.slice(-8) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(vital.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                        {vital.visit?.chief_complaint && (
                          <div className="text-xs text-gray-600 mb-2">
                            Chief Complaint: {vital.visit.chief_complaint}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {vital.heightCm && (
                            <div className="text-center">
                              <div className="text-gray-500">Height</div>
                              <div className="font-medium">{vital.heightCm} cm</div>
                            </div>
                          )}
                          {vital.weightKg && (
                            <div className="text-center">
                              <div className="text-gray-500">Weight</div>
                              <div className="font-medium">{vital.weightKg} kg</div>
                            </div>
                          )}
                          {vital.tempC && (
                            <div className="text-center">
                              <div className="text-gray-500">Temp</div>
                              <div className="font-medium">{vital.tempC} °C</div>
                            </div>
                          )}
                          {vital.hr && (
                            <div className="text-center">
                              <div className="text-gray-500">HR</div>
                              <div className="font-medium">{vital.hr} bpm</div>
                            </div>
                          )}
                          {vital.sbp && vital.dbp && (
                            <div className="text-center">
                              <div className="text-gray-500">BP</div>
                              <div className="font-medium">{vital.sbp}/{vital.dbp}</div>
                            </div>
                          )}
                          {vital.spo2 && (
                            <div className="text-center">
                              <div className="text-gray-500">SpO2</div>
                              <div className="font-medium">{vital.spo2}%</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No previous vitals found</p>
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
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
