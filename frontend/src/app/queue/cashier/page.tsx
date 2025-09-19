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
  CreditCard,
  Package,
  Search,
  Plus,
  Minus,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GraphQLAPI } from '@/clients/graphql';
import PageGuard from '@/components/guards/page-guard';

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

interface Product {
  id: string;
  product_name: string;
  sale_price: number;
  unit: string;
  stock_quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const statusConfig = {
  waiting: { label: 'Waiting', color: 'bg-blue-100 text-blue-800', icon: Clock },
  called: { label: 'Called', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
  in_service: { label: 'In Service', color: 'bg-teal-100 text-teal-800', icon: Activity },
  done: { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: CheckCircle },
};

export default function CashierQueuePage() {
  const [cashierTickets, setCashierTickets] = useState<CashierTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // POS Modal states
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CashierTicket | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProducts, setSearchProducts] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchCashierQueue();
    // Set up polling for real-time updates
    const interval = setInterval(fetchCashierQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const fetchCashierQueue = async () => {
    try {
      setIsLoading(true);
      
      const result = await GraphQLAPI.getQueueTickets({
        station: 'cashier',
        status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
        pagination: { take: 100 }
      });
      
      setCashierTickets(result.queueTickets || []);

    } catch (error: any) {
      console.error('Error fetching cashier queue:', error);
      toast.error(error.message || 'Failed to load cashier queue');
    } finally {
      setIsLoading(false);
    }
  };

  const callTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'called');
      toast.success('Patient called');
      fetchCashierQueue(); // Refresh data

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
      toast.success('Cashier service started');
      fetchCashierQueue(); // Refresh data

    } catch (error: any) {
      console.error('Error starting ticket:', error);
      toast.error(error.message || 'Failed to start cashier service');
    } finally {
      setIsUpdating(null);
    }
  };

  const completeTicket = async (ticketId: string) => {
    try {
      setIsUpdating(ticketId);
      
      await GraphQLAPI.updateQueueStatus(ticketId, 'done');
      toast.success('Cashier service completed');
      fetchCashierQueue(); // Refresh data

    } catch (error: any) {
      console.error('Error completing ticket:', error);
      toast.error(error.message || 'Failed to complete cashier service');
    } finally {
      setIsUpdating(null);
    }
  };

  const openPOSModal = (ticket: CashierTicket) => {
    setSelectedTicket(ticket);
    setCart([]);
    setSearchProducts('');
    setProducts([]);
    setIsPOSModalOpen(true);
  };

  const searchProductsByName = async (query: string) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }

    try {
      setIsSearchingProducts(true);
      const result = await GraphQLAPI.searchProducts(query);
      setProducts(result.searchProducts || []);
    } catch (error: any) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: product.sale_price,
        total_price: product.sale_price
      }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity, total_price: quantity * item.unit_price }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const processPayment = async () => {
    if (!selectedTicket?.visit || cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Create order
      const orderResult = await GraphQLAPI.createOrder({
        patientId: selectedTicket.patientId,
        status: 'completed',
        total_amount: getTotalAmount(),
        is_walkin: false,
        orderItems: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      });

      // Link order to visit
      await GraphQLAPI.linkOrderToVisit({
        visitId: selectedTicket.visit.id,
        orderId: orderResult.createOrder.id
      });

      // Process payment
      await GraphQLAPI.processPayment({
        orderId: orderResult.createOrder.id,
        payment_type: 'cash',
        amount: getTotalAmount(),
        details: 'Payment processed at cashier station'
      });

      toast.success('Payment processed successfully!');
      
      // Close modal and refresh data
      setIsPOSModalOpen(false);
      setSelectedTicket(null);
      setCart([]);
      fetchCashierQueue();

    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
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
                <strong>Diagnosis:</strong> {ticket.visit.diagnosis}
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
                Start Service
              </Button>
            )}
            
            {ticket.status === 'in_service' && (
              <>
                {ticket.visit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPOSModal(ticket)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    POS
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
            <h1 className="text-3xl font-bold text-gray-900">Cashier Queue</h1>
            <p className="text-gray-600 mt-1">Manage cashier service queue</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchCashierQueue}
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

        {/* POS Modal */}
        <Dialog open={isPOSModalOpen} onOpenChange={setIsPOSModalOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                POS - {selectedTicket?.patient?.first_name} {selectedTicket?.patient?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Search & Selection */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="searchProducts" className="text-sm font-medium">
                    Search Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="searchProducts"
                      placeholder="Search by product name..."
                      value={searchProducts}
                      onChange={(e) => {
                        setSearchProducts(e.target.value);
                        searchProductsByName(e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Product Results */}
                {products.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-sm text-gray-600">
                              ฿{product.sale_price} / {product.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Stock: {product.stock_quantity}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearchingProducts && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                )}
              </div>
              
              {/* Cart & Payment */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Cart</h3>
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No items in cart</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex-1">
                            <div className="font-medium">{item.product.product_name}</div>
                            <div className="text-sm text-gray-600">
                              ฿{item.unit_price} / {item.product.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <div className="ml-4 font-semibold">
                              ฿{item.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Total & Payment */}
                {cart.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ฿{getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                    
                    <Button
                      onClick={processPayment}
                      disabled={isProcessingPayment}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isProcessingPayment ? 'Processing...' : 'Process Payment'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
