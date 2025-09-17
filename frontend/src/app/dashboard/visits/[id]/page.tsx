'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Clock, 
  Activity, 
  ShoppingCart, 
  Plus, 
  Save, 
  ExternalLink,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Zap,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';

interface Visit {
  id: string;
  visit_date: string;
  status: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    national_id?: string;
    phone?: string;
    email?: string;
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
  visitOrders: Array<{
    id: string;
    order: {
      id: string;
      order_date: string;
      total_amount?: number;
      status?: string;
      orderItems: Array<{
        id: string;
        product_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
    };
  }>;
  queueTickets: Array<{
    id: string;
    station: string;
    status: string;
    number: number;
    created_at: string;
  }>;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  triage: 'bg-yellow-100 text-yellow-800',
  doctor: 'bg-teal-100 text-teal-800',
  pharmacy: 'bg-green-100 text-green-800',
  cashier: 'bg-orange-100 text-orange-800',
  done: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [linkOrderId, setLinkOrderId] = useState('');
  const [isLinkingOrder, setIsLinkingOrder] = useState(false);
  
  // Form states
  const [soapForm, setSoapForm] = useState({
    chief_complaint: '',
    diagnosis: '',
    notes: ''
  });
  
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

  useEffect(() => {
    fetchVisitData();
  }, [visitId]);

  const fetchVisitData = async () => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getVisit(visitId);
      const visitData = result.visit;
      setVisit(visitData);
      
      // Populate forms
      setSoapForm({
        chief_complaint: visitData.chief_complaint || '',
        diagnosis: visitData.diagnosis || '',
        notes: visitData.notes || ''
      });
      
      if (visitData.vitals) {
        setVitalsForm({
          heightCm: visitData.vitals.heightCm?.toString() || '',
          weightKg: visitData.vitals.weightKg?.toString() || '',
          tempC: visitData.vitals.tempC?.toString() || '',
          sbp: visitData.vitals.sbp?.toString() || '',
          dbp: visitData.vitals.dbp?.toString() || '',
          hr: visitData.vitals.hr?.toString() || '',
          rr: visitData.vitals.rr?.toString() || '',
          spo2: visitData.vitals.spo2?.toString() || ''
        });
      }

    } catch (error: any) {
      console.error('Error fetching visit data:', error);
      toast.error(error.message || 'Failed to load visit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSOAP = async () => {
    try {
      setIsSaving(true);
      
      await GraphQLAPI.updateVisit(visitId, soapForm);
      toast.success('SOAP notes saved successfully!');
      fetchVisitData(); // Refresh data

    } catch (error: any) {
      console.error('Error saving SOAP notes:', error);
      toast.error(error.message || 'Failed to save SOAP notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVitals = async () => {
    try {
      setIsSaving(true);
      
      const vitalsData: any = { visitId };
      
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
      toast.success('Vitals saved successfully!');
      fetchVisitData(); // Refresh data

    } catch (error: any) {
      console.error('Error saving vitals:', error);
      toast.error(error.message || 'Failed to save vitals');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkOrder = async () => {
    if (!linkOrderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    try {
      setIsLinkingOrder(true);
      
      await GraphQLAPI.linkOrderToVisit({
        visitId,
        orderId: linkOrderId.trim()
      });

      toast.success('Order linked successfully!');
      setLinkOrderId('');
      fetchVisitData(); // Refresh data

    } catch (error: any) {
      console.error('Error linking order:', error);
      toast.error(error.message || 'Failed to link order');
    } finally {
      setIsLinkingOrder(false);
    }
  };

  const handleCreateQueueTicket = async (station: string) => {
    try {
      const result = await GraphQLAPI.createQueueTicket({
        visitId,
        station: station.toLowerCase()
      });

      const ticket = result.createQueueTicket;
      toast.success(`Queue ticket created: ${station} #${ticket.number}`);
      fetchVisitData(); // Refresh data

    } catch (error: any) {
      console.error('Error creating queue ticket:', error);
      toast.error(error.message || 'Failed to create queue ticket');
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Visit not found</h2>
          <p className="text-gray-600 mt-2">The visit you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageGuard requiredPermission="visits:read">
      <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            การเยี่ยม - {visit.patient.first_name} {visit.patient.last_name}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={statusColors[visit.status] || 'bg-gray-100 text-gray-800'}>
              {visit.status.toUpperCase()}
            </Badge>
            <span className="text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" />
              {format(new Date(visit.visit_date), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/pos')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            ไป POS เปิดบิล
          </Button>
          
          <Button
            onClick={() => handleCreateQueueTicket('pharmacy')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            ออกบัตรคิว
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* SOAP Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                บันทึก SOAP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chief_complaint">Chief Complaint (อาการสำคัญ)</Label>
                <Textarea
                  id="chief_complaint"
                  value={soapForm.chief_complaint}
                  onChange={(e) => setSoapForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                  placeholder="อาการสำคัญที่ผู้ป่วยมาพบแพทย์..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnosis">Diagnosis (การวินิจฉัย)</Label>
                <Textarea
                  id="diagnosis"
                  value={soapForm.diagnosis}
                  onChange={(e) => setSoapForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="การวินิจฉัยโรค..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (หมายเหตุ)</Label>
                <Textarea
                  id="notes"
                  value={soapForm.notes}
                  onChange={(e) => setSoapForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleSaveSOAP} 
                disabled={isSaving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save SOAP Notes'}
              </Button>
            </CardContent>
          </Card>

          {/* Vitals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                สัญญาณชีพ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heightCm" className="flex items-center gap-1">
                    <Ruler className="w-4 h-4" />
                    Height (cm)
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
                    Weight (kg)
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
                    Temperature (°C)
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
                    Heart Rate (bpm)
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
              
              {visit.vitals?.bmi && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>BMI:</strong> {visit.vitals.bmi.toFixed(2)}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleSaveVitals} 
                disabled={isSaving}
                className="w-full mt-4"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Vitals'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Link Order */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                เชื่อมบิล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={linkOrderId}
                  onChange={(e) => setLinkOrderId(e.target.value)}
                  placeholder="Enter Order ID..."
                />
                <Button 
                  onClick={handleLinkOrder} 
                  disabled={isLinkingOrder}
                >
                  {isLinkingOrder ? 'Linking...' : 'Link'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Linked Orders */}
          <Card>
            <CardHeader>
              <CardTitle>บิลที่เชื่อมโยง ({visit.visitOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {visit.visitOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No linked orders</p>
              ) : (
                <div className="space-y-3">
                  {visit.visitOrders.map((visitOrder) => (
                    <div key={visitOrder.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Order #{visitOrder.order.id.slice(-8)}</span>
                        <Badge variant="outline">
                          ฿{visitOrder.order.total_amount?.toFixed(2) || '0.00'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {format(new Date(visitOrder.order.order_date), 'dd/MM/yyyy HH:mm')}
                      </div>
                      
                      <div className="space-y-1">
                        {visitOrder.order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product_name || 'Unknown Product'}</span>
                            <span>{item.quantity} × ฿{item.unit_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>บัตรคิว ({visit.queueTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {visit.queueTickets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No queue tickets</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['triage', 'doctor', 'pharmacy', 'cashier'].map((station) => (
                      <Button
                        key={station}
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateQueueTicket(station)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {station}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {visit.queueTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{ticket.station} #{ticket.number}</span>
                        <Badge className={`ml-2 ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(ticket.created_at), 'HH:mm')}
                      </span>
                    </div>
                  ))}
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
