import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { getCookie } from '@/utils/common';
import { APP_CONSTANTS } from '@/constants';
import { User, UserProfile, UpdateUserInput, UsersResponse, ChangePasswordResponse } from '@/types/user';
import { logger } from '@/lib/logger';
import { MappedProductData, ImportResult, ImportSettings } from '@/types/csv-import';
import { handleAuthError } from '@/utils/auth';
import { cache, CACHE_CONFIG, CACHE_CONTEXTS, SENSITIVE_NAMESPACES, AUTH_SCOPE_NAMESPACES } from '@/lib/cache';

// Product interface for GraphQL operations
interface Product {
  id: string;
  product_name: string;
  product_type?: string;
  generic_name?: string;
  short_name?: string;
  status?: string;
  vat_percent?: number;
  expiration_warning_date?: string;
  sale_price: number;
  unit?: string;
  pack_size?: string;
  reorder_point?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock_quantity?: number;
  volume?: number;
  volume_unit?: string;
  shelf_code?: string;
  shelf_row?: string;
  category?: Category;
  categoryId?: string;
  symptom_category?: string;
  license_number?: string;
  dosage_unit?: string;
  dosage?: string;
  times_per_day?: number;
  interval_hours?: number;
  before_meal?: boolean;
  after_meal?: boolean;
  after_meal_immediate?: boolean;
  morning?: boolean;
  noon?: boolean;
  evening?: boolean;
  before_bed?: boolean;
  properties?: string;
  usage_instruction?: string;
  sale_note?: string;
  purchase_note?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  code?: string;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

// Additional types for GraphQL
interface CreateUserInput {
  role: string;
  email: string;
  username: string;
  password: string;
  status?: string;
}

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
  latitude?: number;
  longitude?: number;
  drug_allergies?: string;
  drug_allergies_other?: string;
  medical_conditions?: string;
  notes?: string;
  photo_url?: string;
  photo_path?: string;
  created_at: string;
  updated_at: string;
}

interface CreatePatientInput {
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
  latitude?: number;
  longitude?: number;
  drug_allergies?: string;
  drug_allergies_other?: string;
  medical_conditions?: string;
  notes?: string;
  photo_url?: string;
  photo_path?: string;
}

interface UpdatePatientInput {
  first_name?: string;
  last_name?: string;
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
  latitude?: number;
  longitude?: number;
  drug_allergies?: string;
  drug_allergies_other?: string;
  medical_conditions?: string;
  notes?: string;
  photo_url?: string;
  photo_path?: string;
}

interface PatientsResponse {
  patients: Patient[];
  total: number;
}

interface UserFilterInput {
  role?: string;
  status?: string;
  email?: string;
  username?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  code?: string;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

interface CreateCategoryInput {
  name: string;
  description?: string;
  code?: string;
}

interface UpdateCategoryInput {
  name?: string;
  description?: string;
  code?: string;
}

interface PaginationInput {
  skip?: number;
  take?: number;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface GraphQLRequestOptions {
  variables?: Record<string, any>;
  operationName?: string;
  skipCache?: boolean;
}

class GraphQLClient {
  private baseURL: string;
  private endpoint: string;
  private timeout: number;
  private authErrorHandler?: (error: any) => void;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private currentContext: string = CACHE_CONTEXTS.DEFAULT;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoint = API_CONFIG.ENDPOINTS.GRAPHQL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Set current context for cache isolation
  setContext(context: string): void {
    this.currentContext = context;
    cache.setContext(context);
  }

  // Get current context
  getContext(): string {
    return this.currentContext;
  }

  // Set authentication error handler
  setAuthErrorHandler(handler: (error: any) => void) {
    this.authErrorHandler = handler;
  }

  // Check if query should be cached
  private shouldCache(query: string): boolean {
    // Cache only read operations (queries, not mutations)
    return query.trim().startsWith('query') || query.trim().startsWith('{');
  }

  // Generate cache key for query with namespace and context
  private generateCacheKey(query: string, variables?: any): string {
    const operationName = this.extractOperationName(query);
    const namespace = this.getNamespaceForOperation(operationName);
    
    // Add operation-specific identifier to prevent collision
    const operationId = this.getOperationIdentifier(operationName, variables);
    
    const cacheKey = cache.generateKey(operationId, variables, {
      namespace,
      context: this.currentContext
    });
    
    // Debug: Log cache key generation
    logger.info('Generated cache key', { 
      operationName, 
      operationId, 
      namespace, 
      context: this.currentContext, 
      variables,
      cacheKey 
    }, 'GRAPHQL_CACHE');
    
    return cacheKey;
  }

  // Get operation-specific identifier to prevent cache collision
  private getOperationIdentifier(operationName: string, variables?: any): string {
    // For queue operations, include station in identifier
    if (operationName === 'GetQueueTickets' && variables?.station) {
      return `${operationName}:${variables.station}`;
    }
    
    // For triage operations, include status in identifier
    if (operationName === 'GetTriageQueue' && variables?.status) {
      return `${operationName}:${variables.status}`;
    }
    
    return operationName;
  }

  // Generate request key for deduplication
  private generateRequestKey(query: string, variables?: any): string {
    const operationName = this.extractOperationName(query);
    const variablesStr = variables ? JSON.stringify(variables) : '';
    return `${operationName}:${variablesStr}`;
  }

  // Extract operation name from query
  private extractOperationName(query: string): string {
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    return match ? match[1] : 'anonymous';
  }

  // Get namespace for operation based on operation name
  private getNamespaceForOperation(operationName: string): string {
    // Check specific operations first (more specific to less specific)
    if (operationName === 'GetTriageQueue') return CACHE_CONFIG.TRIAGE.NAMESPACE;
    if (operationName === 'GetQueueTickets') return CACHE_CONFIG.QUEUE.NAMESPACE;
    if (operationName.includes('Triage')) return CACHE_CONFIG.TRIAGE.NAMESPACE;
    if (operationName.includes('Queue')) return CACHE_CONFIG.QUEUE.NAMESPACE;
    if (operationName.includes('Products')) return CACHE_CONFIG.PRODUCTS.NAMESPACE;
    if (operationName.includes('Categories')) return CACHE_CONFIG.CATEGORIES.NAMESPACE;
    if (operationName.includes('User')) return CACHE_CONFIG.USER_DATA.NAMESPACE;
    if (operationName.includes('Patient')) return CACHE_CONFIG.PATIENTS.NAMESPACE;
    if (operationName.includes('Order')) return CACHE_CONFIG.ORDERS.NAMESPACE;
    return 'default';
  }

  // Get cache TTL based on operation
  private getCacheTTL(operationName: string): number {
    // Check specific operations first (more specific to less specific)
    if (operationName === 'GetTriageQueue') return CACHE_CONFIG.TRIAGE.TTL;
    if (operationName === 'GetQueueTickets') return CACHE_CONFIG.QUEUE.TTL;
    if (operationName.includes('Triage')) return CACHE_CONFIG.TRIAGE.TTL;
    if (operationName.includes('Queue')) return CACHE_CONFIG.QUEUE.TTL;
    if (operationName.includes('Products')) return CACHE_CONFIG.PRODUCTS.TTL;
    if (operationName.includes('Categories')) return CACHE_CONFIG.CATEGORIES.TTL;
    if (operationName.includes('User')) return CACHE_CONFIG.USER_DATA.TTL;
    if (operationName.includes('Patient')) return CACHE_CONFIG.PATIENTS.TTL;
    if (operationName.includes('Order')) return CACHE_CONFIG.ORDERS.TTL;
    return 2 * 60 * 1000; // Default 2 minutes
  }

  // Invalidate cache for specific operation
  invalidateCache(operationName: string, variables?: any): void {
    const namespace = this.getNamespaceForOperation(operationName);
    const operationId = this.getOperationIdentifier(operationName, variables);
    const cacheKey = cache.generateKey(operationId, variables, {
      namespace,
      context: this.currentContext
    });
    cache.delete(cacheKey);
    logger.info('Invalidated GraphQL cache', { cacheKey, namespace, context: this.currentContext }, 'GRAPHQL_CACHE');
  }

  // Invalidate all cache entries matching a pattern
  invalidateCachePattern(pattern: string): void {
    const stats = cache.getStats();
    const keysToDelete = stats.keys.filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => cache.delete(key));
    logger.info('Invalidated GraphQL cache pattern', { pattern, count: keysToDelete.length }, 'GRAPHQL_CACHE');
  }

  // Clear all cache
  clearCache(): void {
    cache.clear();
    logger.info('Cleared all GraphQL cache', {}, 'GRAPHQL_CACHE');
  }

  // Clear cache for current context
  clearContextCache(): void {
    cache.clearContext(this.currentContext);
    logger.info('Cleared GraphQL cache for context', { context: this.currentContext }, 'GRAPHQL_CACHE');
  }

  // Clear sensitive data cache (for navigation)
  clearSensitiveCache(): void {
    SENSITIVE_NAMESPACES.forEach(namespace => {
      cache.clearNamespace(namespace);
    });
    logger.info('Cleared sensitive GraphQL cache', { namespaces: SENSITIVE_NAMESPACES }, 'GRAPHQL_CACHE');
  }

  // Clear auth scope cache (for auth changes)
  clearAuthScopeCache(): void {
    AUTH_SCOPE_NAMESPACES.forEach(namespace => {
      cache.clearNamespace(namespace);
    });
    logger.info('Cleared auth scope GraphQL cache', { namespaces: AUTH_SCOPE_NAMESPACES }, 'GRAPHQL_CACHE');
  }

  private async request<T>(
    query: string,
    options: GraphQLRequestOptions = {}
  ): Promise<T> {
    // Generate request key for deduplication
    const requestKey = this.generateRequestKey(query, options.variables);
    
    // Check if there's already a pending request for the same query
    if (this.pendingRequests.has(requestKey)) {
      logger.info('Deduplicating GraphQL request', { requestKey }, 'GRAPHQL_DEDUP');
      return this.pendingRequests.get(requestKey)!;
    }

    // Check if we've made this request recently (within 1 second)
    const now = Date.now();
    const lastTime = this.lastRequestTime.get(requestKey) || 0;
    const timeSinceLastRequest = now - lastTime;
    
    if (timeSinceLastRequest < 1000) {
      logger.info('Rate limiting GraphQL request', { requestKey, timeSinceLastRequest }, 'GRAPHQL_RATE_LIMIT');
      throw new Error('Request too frequent. Please wait a moment.');
    }

    // Check cache first for read operations
    if (this.shouldCache(query) && !options.skipCache) {
      const cacheKey = this.generateCacheKey(query, options.variables);
      const cachedData = cache.get<T>(cacheKey);
      
      if (cachedData) {
        logger.info('Cache hit for GraphQL query', { cacheKey }, 'GRAPHQL_CACHE');
        return cachedData;
      }
    }

    const url = `${this.baseURL}${this.endpoint}`;

    // Debug: Log request information
    logger.api.request(url, 'POST');

    const body = {
      query: query.trim(),
      variables: options.variables || {},
      ...(options.operationName && { operationName: options.operationName }),
    };

    // Prepare headers - rely on HttpOnly cookies for authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method: 'POST',
      credentials: 'include', // This ensures HttpOnly cookies are sent automatically
      headers,
      body: JSON.stringify(body),
    };

    // Update last request time
    this.lastRequestTime.set(requestKey, now);

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        (error as any).status = response.status;
        throw error;
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        logger.error('GraphQL operation returned errors', result.errors, 'GRAPHQL');
        
        // Check for authentication errors
        const authError = result.errors.find(err => 
          err.message?.includes('Authentication required') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('Not authenticated') ||
          err.message?.includes('Invalid token') ||
          err.message?.includes('Token expired')
        );
        
        if (authError && this.authErrorHandler) {
          this.authErrorHandler(authError);
          return {} as T; // Return empty data to prevent further processing
        }
        
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      // Cache successful responses for read operations
      if (this.shouldCache(query) && !options.skipCache) {
        const cacheKey = this.generateCacheKey(query, options.variables);
        const operationName = this.extractOperationName(query);
        const ttl = this.getCacheTTL(operationName);
        
        cache.set(cacheKey, result.data, ttl);
        logger.info('Cached GraphQL response', { cacheKey, ttl }, 'GRAPHQL_CACHE');
      }

        return result.data;
      } catch (error) {
        logger.api.error(url, error);
        
        // Handle authentication errors
        if (this.authErrorHandler) {
          handleAuthError(error, () => {
            this.authErrorHandler?.(error);
          });
        }
        
        if (error instanceof Error) {
          throw new Error(`GraphQL request failed: ${error.message}`);
        }
        throw error;
      } finally {
        // Remove from pending requests when done
        this.pendingRequests.delete(requestKey);
      }
    })();

    // Store the promise in pending requests
    this.pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  async query<T>(query: string, options?: GraphQLRequestOptions): Promise<T> {
    return this.request<T>(query, options);
  }

  async mutation<T>(mutation: string, options?: GraphQLRequestOptions): Promise<T> {
    return this.request<T>(mutation, options);
  }
}

export const graphqlClient = new GraphQLClient();

// GraphQL Queries and Mutations
export const GraphQLQueries = {
  // User queries
  ME: `
    query Me {
      me {
        id
        username
        email
        role
        status
      }
    }
  `,

  // User profile with more details
  USER_PROFILE: `
    query UserProfile {
      me {
        id
        username
        email
        role
        status
        created_at
        updated_at
      }
    }
  `,

  // Get all users (admin only)
  ALL_USERS: `
    query AllUsers($filter: UserFilterInput, $pagination: PaginationInput) {
      users(filter: $filter, pagination: $pagination) {
        users {
          id
          username
          email
          role
          status
          created_at
          updated_at
        }
        total
      }
    }
  `,

  // Get all patients (staff access)
  ALL_PATIENTS: `
    query AllPatients($pagination: PaginationInput) {
      patients(pagination: $pagination) {
        patients {
          id
          first_name
          last_name
          national_id
          date_of_birth
          gender
          phone
          email
          address
          photo_url
          created_at
          updated_at
        }
        total
      }
    }
  `,

  // Search patients
  SEARCH_PATIENTS: `
    query SearchPatients($query: String!) {
      searchPatients(query: $query) {
        id
        first_name
        last_name
        national_id
        phone
        email
        date_of_birth
        gender
        photo_url
        drug_allergies
        medical_conditions
      }
    }
  `,

  // Product queries - minimal data for listing
  ALL_PRODUCTS: `
    query Products($filter: ProductFilterInput, $pagination: PaginationInput) {
      products(filter: $filter, pagination: $pagination) {
        total
        products {
          id
          product_name
          product_type
          short_name
          status
          vat_percent
          sale_price
          unit
          pack_size
          stock_quantity
          sku
          barcode
          image_url
          categoryId
          category {
            id
            name
            description
            code
          }
          created_at
          updated_at
        }
      }
    }
  `,

  // Complete product data for export (single page)
  EXPORT_PRODUCTS_PAGE: `
    query ExportProductsPage($pagination: PaginationInput) {
      products(filter: { status: "active" }, pagination: $pagination) {
        total
        products {
          id
          product_name
          product_type
          generic_name
          short_name
          status
          vat_percent
          expiration_warning_date
          sale_price
          unit
          pack_size
          reorder_point
          cost
          sku
          barcode
          stock_quantity
          volume
          volume_unit
          shelf_code
          shelf_row
          categoryId
          category {
            id
            name
            description
            code
          }
          symptom_category
          license_number
          dosage_unit
          dosage
          times_per_day
          interval_hours
          before_meal
          after_meal
          after_meal_immediate
          morning
          noon
          evening
          before_bed
          properties
          usage_instruction
          sale_note
          purchase_note
          image_url
          image_path
          created_at
          updated_at
        }
      }
    }
  `,

  SEARCH_PRODUCTS: `
    query SearchProducts($query: String!) {
      searchProducts(query: $query) {
        id
        product_name
        product_type
        short_name
        sale_price
        unit
        stock_quantity
        sku
        barcode
        vat_percent
        category {
          id
          name
          description
          code
        }
        categoryId
      }
    }
  `,

  GET_PRODUCT: `
    query Products($id: String!) {
      product(id: $id) {
        id
        product_name
        product_type
        generic_name
        short_name
        status
        vat_percent
        expiration_warning_date
        sale_price
        unit
        pack_size
        reorder_point
        cost
        sku
        barcode
        stock_quantity
        volume
        volume_unit
        shelf_code
        shelf_row
        category {
          id
          name
          description
          code
        }
        categoryId
        symptom_category
        license_number
        dosage_unit
        dosage
        times_per_day
        interval_hours
        before_meal
        after_meal
        after_meal_immediate
        morning
        noon
        evening
        before_bed
        properties
        usage_instruction
        sale_note
        purchase_note
        image_url
        image_path
        created_at
        updated_at
      }
    }
  `,

  // Category queries
  ALL_CATEGORIES: `
    query Categories {
      categories {
        id
        name
        description
        code
        created_at
        updated_at
      }
    }
  `,

  GET_CATEGORY: `
    query Category($id: String!) {
      category(id: $id) {
        id
        name
        description
        code
        created_at
        updated_at
        products {
          id
          product_name
          status
          stock_quantity
        }
      }
    }
  `,

  CHECK_SKU_EXISTS: `
    query CheckSkuExists($sku: String!) {
      checkSkuExists(sku: $sku)
    }
  `,

  // Order Queries
  ALL_ORDERS: `
    query GetAllOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
      orders(filter: $filter, pagination: $pagination) {
        orders {
          id
          order_date
          status
          total_amount
          is_walkin
          created_at
          updated_at
          patient {
            id
            first_name
            last_name
          }
          user {
            id
            username
          }
          orderItems {
            id
            quantity
            unit_price
            total_price
            product_name
            product_unit
            product {
              id
              product_name
              sku
              unit
            }
          }
          payments {
            id
            payment_type
            amount
            payment_date
            details
          }
        }
        total
      }
    }
  `,

  TODAY_ORDERS: `
    query GetTodayOrders($date_from: DateTime, $date_to: DateTime) {
      orders(filter: { date_from: $date_from, date_to: $date_to }, pagination: { skip: 0, take: 100 }) {
        orders {
          id
          order_date
          status
          total_amount
          is_walkin
          created_at
          updated_at
          patient {
            id
            first_name
            last_name
          }
          user {
            id
            username
          }
          orderItems {
            id
            quantity
            unit_price
            total_price
            product_name
            product_unit
            product {
              id
              product_name
              sku
              unit
              barcode
              cost
              categoryId
              category {
                id
                name
                description
                code
              }
            }
          }
          payments {
            id
            payment_type
            amount
            payment_date
            details
          }
        }
        total
      }
    }
  `,

  PATIENT_ORDERS: `
    query GetPatientOrders($patientId: String!, $pagination: PaginationInput) {
      orders(filter: { patientId: $patientId }, pagination: $pagination) {
        orders {
          id
          order_date
          status
          total_amount
          is_walkin
          created_at
          updated_at
          patient {
            id
            first_name
            last_name
          }
          user {
            id
            username
          }
          orderItems {
            id
            quantity
            unit_price
            total_price
            product_name
            product_unit
            product {
              id
              product_name
              sku
              unit
            }
          }
          payments {
            id
            payment_type
            amount
            payment_date
            details
          }
        }
        total
      }
    }
  `,

  GET_ORDER: `
    query GetOrder($id: String!) {
      order(id: $id) {
        id
        order_date
          status
          total_amount
          is_walkin
          created_at
          updated_at
          patient {
            id
            first_name
            last_name
          }
          user {
            id
            username
          }
          orderItems {
            id
            quantity
            unit_price
            total_price
            product_name
            product_unit
            product {
              id
              product_name
              sku
              unit
            }
          }
          payments {
            id
            payment_type
            amount
            payment_date
            details
          }
      }
    }
  `,

  // Report Queries
  DAILY_REPORTS: `
    query DailyReports($date_from: DateTime, $date_to: DateTime) {
      dailyReports(date_from: $date_from, date_to: $date_to) {
        id
        report_date
        total_sales
        total_orders
        total_patients
        created_at
        createdByUserId
        created_by_username
      }
    }
  `,

  SALES_REPORTS: `
    query SalesReports($date_from: DateTime, $date_to: DateTime, $productId: String) {
      salesReports(date_from: $date_from, date_to: $date_to, productId: $productId) {
        id
        report_date
        quantity_sold
        total_sales
        created_at
        createdByUserId
        created_by_username
        product {
          id
          product_name
          unit
        }
      }
    }
  `,

  STOCKS: `
    query Stocks($productId: String, $pagination: PaginationInput) {
      stocks(productId: $productId, pagination: $pagination) {
        id
        quantity
        quantity_in
        is_outofstock
        production_date
        expiration_date
        reference_table
        reference_id
        note
        created_at
        createdByUserId
        created_by_username
        product_name
        product_unit
        product {
          id
          product_name
          unit
        }
      }
    }
  `,

  STOCK_ALERTS: `
    query StockAlerts($acknowledged: Boolean, $pagination: PaginationInput) {
      stockAlerts(acknowledged: $acknowledged, pagination: $pagination) {
        id
        alert_type
        alert_message
        created_at
        createdByUserId
        created_by_username
        acknowledged
        acknowledged_at
        product {
          id
          product_name
          stock_quantity
          reorder_point
        }
      }
    }
  `,

  LOW_STOCK_PRODUCTS: `
    query LowStockProducts {
      lowStockProducts {
        id
        product_name
        stock_quantity
        reorder_point
        unit
        vat_percent
        sale_price
        category {
          name
        }
      }
    }
  `,

  // Visit Queries
  GET_PATIENT: `
    query GetPatient($id: String!) {
      patient(id: $id) {
        id
        first_name
        last_name
        national_id
        prefix
        nickname
        date_of_birth
        age
        gender
        blood_group
        phone
        email
        address
        subdistrict
        district
        province
        zip_code
        drug_allergies
        drug_allergies_other
        medical_conditions
        notes
        photo_url
        photo_path
        created_at
      }
    }
  `,

  GET_PATIENT_VISITS: `
    query GetPatientVisits($patientId: String!, $pagination: PaginationInput) {
      patientVisits(patientId: $patientId, pagination: $pagination) {
        id
        visit_date
        status
        chief_complaint
        diagnosis
        notes
        appointment {
          id
          appointment_time
          reason
          status
          doctor {
            id
            username
            email
          }
        }
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

  GET_VISIT: `
    query GetVisit($id: String!) {
      visit(id: $id) {
        id
        visit_date
        status
        chief_complaint
        diagnosis
        notes
        patient {
          id
          first_name
          last_name
          national_id
          phone
          email
        }
        appointment {
          id
          appointment_time
          reason
          status
          doctor {
            id
            username
            email
          }
        }
        vitals {
          visitId
          heightCm
          weightKg
          tempC
          sbp
          dbp
          hr
          rr
          spo2
          bmi
        }
        visitOrders {
          id
          order {
            id
            order_date
            total_amount
            status
            orderItems {
              id
              product_name
              quantity
              unit_price
              total_price
            }
          }
        }
        queueTickets {
          id
          station
          status
          number
          created_at
        }
      }
    }
  `,

  // Queue Queries
  GET_QUEUE_TICKETS: `
    query GetQueueTickets($station: QueueStation, $status: QueueStatus, $pagination: PaginationInput) {
      queueTickets(station: $station, status: $status, pagination: $pagination) {
        id
        number
        station
        status
        priority
        patientId
        called_at
        started_at
        done_at
        created_at
        patient {
          id
          first_name
          last_name
          phone
          email
        }
        visit {
          id
          status
          chief_complaint
          diagnosis
          notes
          vitals {
            id
            visitId
            heightCm
            weightKg
            tempC
            sbp
            dbp
            hr
            rr
            spo2
            bmi
            created_at
          }
        }
        events {
          id
          status
          at
          byUserId
          note
        }
      }
    }
  `,

  // Triage Queue Query
  GET_TRIAGE_QUEUE: `
    query GetTriageQueue($status: QueueStatus, $skip: Int, $take: Int, $search: String) {
      triageQueue(status: $status, skip: $skip, take: $take, search: $search) {
        total
        tickets {
          id
          number
          status
          station
          patientId
          priority
          called_at
          started_at
          done_at
          created_at
          patient {
            id
            first_name
            last_name
            phone
            email
          }
          visit {
            id
            status
            chief_complaint
          }
          events {
            id
            status
            at
            byUserId
            note
          }
        }
      }
    }
  `,

  // Patient Vitals Query
  GET_PATIENT_VITALS: `
    query GetPatientVitals($patientId: String!) {
      patientVitals(patientId: $patientId) {
        id
        visitId
        heightCm
        weightKg
        tempC
        sbp
        dbp
        hr
        rr
        spo2
        bmi
        created_at
        visit {
          id
          visit_date
          chief_complaint
        }
      }
    }
  `,

  // Notification Queries
  STOCK_EXPIRY_ALERTS: `
    query StockExpiryAlerts($skip: Int, $take: Int, $search: String) {
      stockExpiryAlerts(skip: $skip, take: $take, search: $search) {
        total
        items {
          stock_id
          product_id
          product_name
          sku
          unit
          quantity
          expiration_date
          days_left
          warn_days
          percent_remaining
          color
          shelf_code
          shelf_row
          barcode
          category
        }
      }
    }
  `,

  TODAYS_APPOINTMENTS: `
    query TodaysAppointments($date: DateTime, $skip: Int, $take: Int, $status: String) {
      todaysAppointments(date: $date, skip: $skip, take: $take, status: $status) {
        total
        items {
          appointment_id
          time
          status
          reason
          patient_id
          patient_fullname
          doctor_id
          doctor_name
        }
      }
    }
  `,
};

export const GraphQLMutations = {
  // Bulk import products
  BULK_IMPORT_PRODUCTS: `
    mutation BulkImportProducts($input: BulkImportProductsInput!) {
      bulkImportProducts(input: $input) {
        success
        message
        imported
        failed
        skipped
        errors
        results {
          product {
            id
            product_name
            sku
            sale_price
          }
          status
          error
          sku
          product_name
        }
      }
    }
  `,

  // Update user profile
  UPDATE_PROFILE: `
    mutation UpdateProfile($input: UpdateUserInput!) {
      updateUser(input: $input) {
        id
        username
        email
        role
        status
      }
    }
  `,

  // Change password
  CHANGE_PASSWORD: `
    mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
      changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
        success
        message
      }
    }
  `,

  // User management mutations (admin only)
  CREATE_USER: `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        username
        email
        role
        status
        created_at
        updated_at
      }
    }
  `,

  UPDATE_USER: `
    mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
      updateUser(id: $id, input: $input) {
        id
        username
        email
        role
        status
        created_at
        updated_at
      }
    }
  `,

  DELETE_USER: `
    mutation DeleteUser($id: String!) {
      deleteUser(id: $id)
    }
  `,

  // Patient management mutations
  CREATE_PATIENT: `
    mutation CreatePatient($input: CreatePatientInput!) {
      createPatient(input: $input) {
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
        updated_at
      }
    }
  `,

  UPDATE_PATIENT: `
    mutation UpdatePatient($id: String!, $input: UpdatePatientInput!) {
      updatePatient(id: $id, input: $input) {
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
        updated_at
      }
    }
  `,

  DELETE_PATIENT: `
    mutation DeletePatient($id: String!) {
      deletePatient(id: $id)
    }
  `,

  // Product mutations
  CREATE_PRODUCT: `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) {
        id
        product_name
        product_type
        generic_name
        short_name
        status
        vat_percent
        expiration_warning_date
        sale_price
        unit
        pack_size
        reorder_point
        cost
        sku
        barcode
        stock_quantity
        volume
        volume_unit
        shelf_code
        shelf_row
        category {
          id
          name
          description
          code
        }
        categoryId
        symptom_category
        license_number
        dosage_unit
        dosage
        times_per_day
        interval_hours
        before_meal
        after_meal
        after_meal_immediate
        morning
        noon
        evening
        before_bed
        properties
        usage_instruction
        sale_note
        purchase_note
        image_url
        image_path
        created_at
        updated_at
      }
    }
  `,

  UPDATE_PRODUCT: `
    mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) {
        id
        product_name
        product_type
        generic_name
        short_name
        status
        vat_percent
        expiration_warning_date
        sale_price
        unit
        pack_size
        reorder_point
        cost
        sku
        barcode
        stock_quantity
        volume
        volume_unit
        shelf_code
        shelf_row
        category {
          id
          name
          description
          code
        }
        categoryId
        symptom_category
        license_number
        dosage_unit
        dosage
        times_per_day
        interval_hours
        before_meal
        after_meal
        after_meal_immediate
        morning
        noon
        evening
        before_bed
        properties
        usage_instruction
        sale_note
        purchase_note
        image_url
        image_path
        created_at
        updated_at
      }
    }
  `,

  DELETE_PRODUCT: `
    mutation DeleteProduct($id: String!) {
      deleteProduct(id: $id)
    }
  `,

  UPDATE_PRODUCT_IMAGE: `
    mutation UpdateProductImage($id: String!, $image_url: String!) {
      updateProductImage(id: $id, image_url: $image_url) {
        id
        product_name
        image_url
        image_path
        updated_at
      }
    }
  `,

  // Category mutations
  CREATE_CATEGORY: `
    mutation CreateCategory($input: CreateCategoryInput!) {
      createCategory(input: $input) {
        id
        name
        description
        code
        created_at
        updated_at
      }
    }
  `,

  UPDATE_CATEGORY: `
    mutation UpdateCategory($id: String!, $input: UpdateCategoryInput!) {
      updateCategory(id: $id, input: $input) {
        id
        name
        description
        code
        created_at
        updated_at
      }
    }
  `,

  DELETE_CATEGORY: `
    mutation DeleteCategory($id: String!) {
      deleteCategory(id: $id)
    }
  `,

  // Order mutations
  CREATE_ORDER: `
    mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        id
        order_date
        status
        total_amount
        is_walkin
        created_at
        updated_at
        orderItems {
          id
          quantity
          unit_price
          total_price
          product {
            id
            product_name
            sku
          }
        }
      }
    }
  `,

  // Payment mutations
  PROCESS_PAYMENT: `
    mutation ProcessPayment($input: CreatePaymentInput!) {
      processPayment(input: $input) {
        id
        payment_type
        amount
        payment_date
        details
        order {
          id
          total_amount
        }
      }
    }
  `,

  // Stock adjustment mutations
  ADJUST_STOCK: `
    mutation AdjustStock($productId: String!, $quantity: Int!, $note: String) {
      adjustStock(productId: $productId, quantity: $quantity, note: $note) {
        id
        quantity
        quantity_in
        is_outofstock
        note
        created_at
        product {
          id
          product_name
          stock_quantity
        }
      }
    }
  `,

  // Create stock mutation
  CREATE_STOCK: `
    mutation CreateStock($input: CreateStockInput!) {
      createStock(input: $input) {
        id
        quantity
        quantity_in
        is_outofstock
        production_date
        expiration_date
        reference_table
        reference_id
        note
        created_at
        createdByUserId
        created_by_username
        product_name
        product_unit
        product {
          id
          product_name
          stock_quantity
        }
      }
    }
  `,

  // Update stock mutation
  UPDATE_STOCK: `
    mutation UpdateStock($id: String!, $input: UpdateStockInput!) {
      updateStock(id: $id, input: $input) {
        id
        quantity
        quantity_in
        is_outofstock
        production_date
        expiration_date
        reference_table
        reference_id
        note
        created_at
        createdByUserId
        created_by_username
        product_name
        product_unit
        product {
          id
          product_name
          stock_quantity
        }
      }
    }
  `,

  // Delete stock mutation
  DELETE_STOCK: `
    mutation DeleteStock($id: String!) {
      deleteStock(id: $id)
    }
  `,

  // Report Mutations
  GENERATE_DAILY_REPORT: `
    mutation GenerateDailyReport($date: DateTime!) {
      generateDailyReport(date: $date) {
        id
        report_date
        total_sales
        total_orders
        total_patients
        created_at
        createdByUserId
        created_by_username
      }
    }
  `,

  ACKNOWLEDGE_STOCK_ALERT: `
    mutation AcknowledgeStockAlert($id: String!) {
      acknowledgeStockAlert(id: $id) {
        id
        acknowledged
        acknowledged_at
      }
    }
  `,

  // Visit Mutations
  CREATE_VISIT: `
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

  UPDATE_VISIT: `
    mutation UpdateVisit($id: String!, $input: UpdateVisitInput!) {
      updateVisit(id: $id, input: $input) {
        id
        chief_complaint
        diagnosis
        notes
      }
    }
  `,

  DELETE_VISIT: `
    mutation DeleteVisit($id: String!) {
      deleteVisit(id: $id)
    }
  `,

  UPSERT_VITALS: `
    mutation UpsertVitals($input: UpsertVitalsInput!) {
      upsertVitals(input: $input) {
        visitId
        heightCm
        weightKg
        tempC
        sbp
        dbp
        hr
        rr
        spo2
        bmi
      }
    }
  `,

  LINK_ORDER_TO_VISIT: `
    mutation LinkOrderToVisit($input: LinkOrderToVisitInput!) {
      linkOrderToVisit(input: $input) {
        id
        order {
          id
          total_amount
          status
        }
      }
    }
  `,

  // Queue Mutations
  CREATE_QUEUE_TICKET: `
    mutation CreateQueueTicket($input: CreateQueueTicketInput!) {
      createQueueTicket(input: $input) {
        id
        number
        station
        status
      }
    }
  `,

  UPDATE_QUEUE_STATUS: `
    mutation UpdateQueueStatus($id: String!, $status: QueueStatus!, $note: String) {
      updateQueueStatus(id: $id, status: $status, note: $note) {
        id
        status
        called_at
        started_at
        done_at
      }
    }
  `,

  // Triage Queue Operations
  CREATE_TRIAGE_TICKET: `
    mutation CreateTriageTicket($patientId: ID!, $priority: Int) {
      createTriageTicket(patientId: $patientId, priority: $priority) {
        id
        number
        status
        station
        patientId
        priority
        created_at
        patient {
          id
          first_name
          last_name
          phone
          email
        }
      }
    }
  `,

  QUEUE_CALL: `
    mutation QueueCall($ticketId: ID!) {
      queueCall(ticketId: $ticketId) {
        id
        status
        called_at
      }
    }
  `,

  QUEUE_START: `
    mutation QueueStart($ticketId: ID!) {
      queueStart(ticketId: $ticketId) {
        id
        status
        started_at
      }
    }
  `,

  QUEUE_COMPLETE: `
    mutation QueueComplete($ticketId: ID!) {
      queueComplete(ticketId: $ticketId) {
        id
        status
        done_at
      }
    }
  `,

  // Appointment Mutations
  CREATE_APPOINTMENT: `
    mutation CreateAppointment($input: CreateAppointmentInput!) {
      createAppointment(input: $input) {
        id
        appointment_time
        status
        reason
        created_at
        updated_at
        patient {
          id
          first_name
          last_name
          phone
        }
        doctor {
          id
          username
        }
      }
    }
  `,

  UPDATE_APPOINTMENT: `
    mutation UpdateAppointment($id: String!, $input: UpdateAppointmentInput!) {
      updateAppointment(id: $id, input: $input) {
        id
        appointment_time
        status
        reason
        created_at
        updated_at
        patient {
          id
          first_name
          last_name
          phone
        }
        doctor {
          id
          username
        }
      }
    }
  `,

  DELETE_APPOINTMENT: `
    mutation DeleteAppointment($id: String!) {
      deleteAppointment(id: $id)
    }
  `,

  DELETE_ALL_QUEUE_TICKETS: `
    mutation DeleteAllQueueTickets {
      deleteAllQueueTickets
    }
  `,

  DELETE_QUEUE_TICKETS_BY_DATE: `
    mutation DeleteQueueTicketsByDate($date: DateTime!) {
      deleteQueueTicketsByDate(date: $date)
    }
  `,
};

// Typed GraphQL API functions
export const GraphQLAPI = {
  // Authentication error handler
  setAuthErrorHandler: (handler: (error: any) => void) => 
    graphqlClient.setAuthErrorHandler(handler),

  // Cache management
  setContext: (context: string) => graphqlClient.setContext(context),
  getContext: () => graphqlClient.getContext(),
  clearCache: () => graphqlClient.clearCache(),
  clearContextCache: () => graphqlClient.clearContextCache(),
  clearSensitiveCache: () => graphqlClient.clearSensitiveCache(),
  clearAuthScopeCache: () => graphqlClient.clearAuthScopeCache(),
  
  // Clear all queue-related cache and force refresh
  clearAllQueueCache: () => {
    // Clear all cache entries that contain queue or triage operations
    graphqlClient.invalidateCachePattern('GetQueueTickets');
    graphqlClient.invalidateCachePattern('GetTriageQueue');
    graphqlClient.invalidateCachePattern('queue:');
    graphqlClient.invalidateCachePattern('triage:');
    
    // Clear cache by namespace to ensure complete cleanup
    cache.clearNamespace('queue');
    cache.clearNamespace('triage');
    
    logger.info('Cleared all queue-related cache', {}, 'GRAPHQL_CACHE');
  },
  
  // Get cache statistics for debugging
  getCacheStats: () => {
    const stats = cache.getStats();
    logger.info('Cache statistics', stats, 'GRAPHQL_CACHE');
    return stats;
  },

  // User operations
  getCurrentUser: (): Promise<{ me: User }> => 
    graphqlClient.query(GraphQLQueries.ME),

  getUserProfile: (): Promise<{ me: UserProfile }> => 
    graphqlClient.query(GraphQLQueries.USER_PROFILE),

  getAllUsers: (variables?: { filter?: UserFilterInput; pagination?: PaginationInput }): Promise<{ users: UsersResponse }> =>
    graphqlClient.query(GraphQLQueries.ALL_USERS, { variables }),

  updateProfile: (input: UpdateUserInput): Promise<{ updateUser: User }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_PROFILE, { 
      variables: { input } 
    }),

  changePassword: (oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> =>
    graphqlClient.mutation(GraphQLMutations.CHANGE_PASSWORD, {
      variables: { oldPassword, newPassword }
    }),

  // User Management Operations (Admin only)
  createUser: (input: CreateUserInput): Promise<{ createUser: User }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_USER, {
      variables: { input }
    }),

  updateUser: (id: string, input: UpdateUserInput): Promise<{ updateUser: User }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_USER, {
      variables: { id, input }
    }),

  deleteUser: (id: string): Promise<{ deleteUser: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_USER, {
      variables: { id }
    }),

  // Patient Operations
  getAllPatients: (variables?: { pagination?: PaginationInput }): Promise<{ patients: PatientsResponse }> =>
    graphqlClient.query(GraphQLQueries.ALL_PATIENTS, { variables }),

  searchPatients: (query: string): Promise<{ searchPatients: Patient[] }> =>
    graphqlClient.query(GraphQLQueries.SEARCH_PATIENTS, {
      variables: { query }
    }),

  createPatient: (input: CreatePatientInput): Promise<{ createPatient: Patient }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_PATIENT, {
      variables: { input }
    }),

  updatePatient: (id: string, input: UpdatePatientInput): Promise<{ updatePatient: Patient }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_PATIENT, {
      variables: { id, input }
    }),

  deletePatient: (id: string): Promise<{ deletePatient: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_PATIENT, {
      variables: { id }
    }),

  // Product Operations
  getAllProducts: (variables?: { filter?: any; pagination?: PaginationInput }): Promise<{ products: any }> =>
    graphqlClient.query(GraphQLQueries.ALL_PRODUCTS, { variables }),

  searchProducts: (query: string): Promise<{ searchProducts: any[] }> =>
    graphqlClient.query(GraphQLQueries.SEARCH_PRODUCTS, {
      variables: { query }
    }),

  getProduct: (id: string): Promise<{ product: any }> =>
    graphqlClient.query(GraphQLQueries.GET_PRODUCT, {
      variables: { id }
    }),

  // Check if SKU exists in the system
  checkSkuExists: (sku: string): Promise<{ checkSkuExists: boolean }> =>
    graphqlClient.query(GraphQLQueries.CHECK_SKU_EXISTS, {
      variables: { sku }
    }),

  // Create product
  createProduct: (input: any): Promise<{ createProduct: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_PRODUCT, {
      variables: { input }
    }),

  // Update product
  updateProduct: (id: string, input: any): Promise<{ updateProduct: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_PRODUCT, {
      variables: { id, input }
    }),

  // Delete product
  deleteProduct: (id: string): Promise<{ deleteProduct: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_PRODUCT, {
      variables: { id }
    }),

  // Update product image
  updateProductImage: (id: string, image_url: string): Promise<{ updateProductImage: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_PRODUCT_IMAGE, {
      variables: { id, image_url }
    }),

  // Order Operations
  getAllOrders: (variables?: { filter?: any; pagination?: PaginationInput }): Promise<{ orders: any }> =>
    graphqlClient.query(GraphQLQueries.ALL_ORDERS, { variables }),

  getTodayOrders: (variables?: { date_from?: string; date_to?: string }): Promise<{ orders: any }> =>
    graphqlClient.query(GraphQLQueries.TODAY_ORDERS, { variables }),

  getPatientOrders: (patientId: string, pagination?: { skip?: number; take?: number }): Promise<{ orders: any }> =>
    graphqlClient.query(GraphQLQueries.PATIENT_ORDERS, {
      variables: { patientId, pagination: pagination || { skip: 0, take: 50 } }
    }),

  getOrder: (id: string): Promise<{ order: any }> =>
    graphqlClient.query(GraphQLQueries.GET_ORDER, {
      variables: { id }
    }),

  createOrder: (input: any): Promise<{ createOrder: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_ORDER, {
      variables: { input }
    }),

  // Payment Operations
  processPayment: (input: any): Promise<{ processPayment: any }> =>
    graphqlClient.mutation(GraphQLMutations.PROCESS_PAYMENT, {
      variables: { input }
    }),

  // Stock Operations
  adjustStock: (productId: string, quantity: number, note?: string): Promise<{ adjustStock: any }> =>
    graphqlClient.mutation(GraphQLMutations.ADJUST_STOCK, {
      variables: { productId, quantity, note }
    }),

  createStock: (input: {
    productId: string
    quantity: number
    quantity_in?: number
    is_outofstock?: boolean
    production_date?: string
    expiration_date?: string
    reference_table?: string
    reference_id?: string
    note?: string
  }): Promise<{ createStock: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_STOCK, {
      variables: { input }
    }),

  updateStock: (id: string, input: {
    quantity?: number
    quantity_in?: number
    is_outofstock?: boolean
    production_date?: string
    expiration_date?: string
    reference_table?: string
    reference_id?: string
    note?: string
  }): Promise<{ updateStock: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_STOCK, {
      variables: { id, input }
    }),

  deleteStock: (id: string): Promise<{ deleteStock: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_STOCK, {
      variables: { id }
    }),

  // Category operations
  getAllCategories: (): Promise<{ categories: Category[] }> =>
    graphqlClient.query(GraphQLQueries.ALL_CATEGORIES),

  getCategory: (id: string): Promise<{ category: Category }> =>
    graphqlClient.query(GraphQLQueries.GET_CATEGORY, {
      variables: { id }
    }),

  createCategory: (input: CreateCategoryInput): Promise<{ createCategory: Category }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_CATEGORY, {
      variables: { input }
    }),

  updateCategory: (id: string, input: UpdateCategoryInput): Promise<{ updateCategory: Category }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_CATEGORY, {
      variables: { id, input }
    }),

  deleteCategory: (id: string): Promise<{ deleteCategory: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_CATEGORY, {
      variables: { id }
    }),

  // Get all products for duplicate checking
  getAllProductsForDuplicateCheck: async (): Promise<{ products: { products: Product[] } }> => {
    const allProducts: Product[] = []
    let skip = 0
    const take = 100 // Maximum allowed per request
    let hasMore = true

    while (hasMore) {
      const result = await graphqlClient.query<{ products: { products: Product[], total: number } }>(
        GraphQLQueries.ALL_PRODUCTS, 
        {
          variables: { 
            pagination: { take, skip }
          }
        }
      )
      
      const products = result.products.products
      allProducts.push(...products)
      
      // Check if there are more products to fetch
      hasMore = products.length === take
      skip += take
      
      // Safety break to prevent infinite loop
      if (skip > 10000) break
    }

    return {
      products: {
        products: allProducts
      }
    }
  },

  // Export all products with complete data (with pagination)
  exportProducts: async (): Promise<{ products: { products: any[], total: number } }> => {
    const allProducts: any[] = []
    let skip = 0
    const take = 100 // Maximum allowed per request
    let hasMore = true

    while (hasMore) {
      const result = await graphqlClient.query<{ products: { products: any[], total: number } }>(
        GraphQLQueries.EXPORT_PRODUCTS_PAGE, 
        {
          variables: { 
            pagination: { take, skip }
          }
        }
      )
      
      const products = result.products.products
      allProducts.push(...products)
      
      // Check if there are more products to fetch
      hasMore = products.length === take
      skip += take
      
      // Safety break to prevent infinite loop
      if (skip > 10000) break
    }

    return {
      products: {
        products: allProducts,
        total: allProducts.length
      }
    }
  },

  // Bulk import products
  bulkImportProducts: (products: MappedProductData[], settings: ImportSettings): Promise<{ bulkImportProducts: ImportResult }> =>
    graphqlClient.mutation(GraphQLMutations.BULK_IMPORT_PRODUCTS, {
      variables: { 
        input: { 
          products, 
          settings 
        } 
      }
    }),

  // Report Operations
  getDailyReports: (variables?: { date_from?: string; date_to?: string }): Promise<{ dailyReports: any[] }> =>
    graphqlClient.query(GraphQLQueries.DAILY_REPORTS, { variables }),

  getSalesReports: (variables?: { date_from?: string; date_to?: string; productId?: string }): Promise<{ salesReports: any[] }> =>
    graphqlClient.query(GraphQLQueries.SALES_REPORTS, { variables }),

  getStocks: (variables?: { productId?: string; pagination?: any }): Promise<{ stocks: any[] }> =>
    graphqlClient.query(GraphQLQueries.STOCKS, { variables }),

  getStockAlerts: (variables?: { acknowledged?: boolean; pagination?: any }): Promise<{ stockAlerts: any[] }> =>
    graphqlClient.query(GraphQLQueries.STOCK_ALERTS, { variables }),

  getLowStockProducts: (): Promise<{ lowStockProducts: any[] }> =>
    graphqlClient.query(GraphQLQueries.LOW_STOCK_PRODUCTS),

  generateDailyReport: (date: string): Promise<{ generateDailyReport: any }> =>
    graphqlClient.mutation(GraphQLMutations.GENERATE_DAILY_REPORT, {
      variables: { date }
    }),

  acknowledgeStockAlert: (id: string): Promise<{ acknowledgeStockAlert: any }> =>
    graphqlClient.mutation(GraphQLMutations.ACKNOWLEDGE_STOCK_ALERT, {
      variables: { id }
    }),

  // Image upload methods
  uploadImage: async (file: File, category: 'product' | 'user' | 'patient'): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file) // Changed from 'image' to 'file' to match backend
    
    // Map frontend categories to backend categories
    const categoryMap = {
      'product': 'products',
      'user': 'users', 
      'patient': 'patients'
    }
    
    const backendCategory = categoryMap[category] || category
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD.IMAGE}/${backendCategory}`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Upload API response:', result)
    
    // Fix URL to use the correct endpoint
    if (result.success && result.data && result.data.url) {
      result.data.url = result.data.url.replace('/uploads/', '/upload/image/')
    }
    
    console.log('Final URL:', result.data?.url)
    // Return the URL directly
    return { url: result.data?.url || '' }
  },

  // Delete uploaded image
  deleteImage: async (filename: string, category: 'product' | 'user' | 'patient'): Promise<void> => {
    // Map frontend categories to backend categories
    const categoryMap = {
      'product': 'products',
      'user': 'users', 
      'patient': 'patients'
    }
    
    const backendCategory = categoryMap[category] || category
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD.IMAGE}/${backendCategory}/${filename}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete failed: ${response.status} - ${errorText}`)
    }
  },

  // Cache management methods
  invalidateCache: (operationName: string, variables?: any) =>
    graphqlClient.invalidateCache(operationName, variables),

  invalidateCachePattern: (pattern: string) =>
    graphqlClient.invalidateCachePattern(pattern),

  // Visit Operations
  getPatient: (id: string): Promise<{ patient: Patient }> =>
    graphqlClient.query(GraphQLQueries.GET_PATIENT, {
      variables: { id },
      skipCache: true // Skip cache for patient details to ensure fresh data
    }),

  getPatientVisits: (patientId: string, pagination?: PaginationInput): Promise<{ patientVisits: any[] }> =>
    graphqlClient.query(GraphQLQueries.GET_PATIENT_VISITS, {
      variables: { patientId, pagination },
      skipCache: true // Skip cache for patient visits to ensure fresh data
    }),

  getVisit: (id: string): Promise<{ visit: any }> =>
    graphqlClient.query(GraphQLQueries.GET_VISIT, {
      variables: { id }
    }),

  createVisit: (input: { patientId: string }): Promise<{ createVisit: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_VISIT, {
      variables: { input }
    }),

  updateVisit: (id: string, input: { chief_complaint?: string; diagnosis?: string; notes?: string; appointmentId?: string }): Promise<{ updateVisit: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_VISIT, {
      variables: { id, input }
    }),

  deleteVisit: (id: string): Promise<{ deleteVisit: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_VISIT, {
      variables: { id }
    }),

  upsertVitals: (input: {
    visitId: string;
    heightCm?: number;
    weightKg?: number;
    tempC?: number;
    sbp?: number;
    dbp?: number;
    hr?: number;
    rr?: number;
    spo2?: number;
  }): Promise<{ upsertVitals: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPSERT_VITALS, {
      variables: { input }
    }),

  linkOrderToVisit: (input: { visitId: string; orderId: string }): Promise<{ linkOrderToVisit: any }> =>
    graphqlClient.mutation(GraphQLMutations.LINK_ORDER_TO_VISIT, {
      variables: { input }
    }),

  // Queue Operations
  getQueueTickets: (variables?: { 
    station?: string; 
    status?: string; 
    pagination?: PaginationInput 
  }, skipCache = false): Promise<{ queueTickets: any[] }> =>
    graphqlClient.query(GraphQLQueries.GET_QUEUE_TICKETS, { variables, skipCache }),

  createQueueTicket: (input: { visitId: string; station: string }): Promise<{ createQueueTicket: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_QUEUE_TICKET, {
      variables: { input }
    }),

  updateQueueStatus: (id: string, status: string, note?: string): Promise<{ updateQueueStatus: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_QUEUE_STATUS, {
      variables: { id, status, note }
    }),

  // Triage Queue Operations
  getTriageQueue: (variables?: { 
    status?: string; 
    skip?: number; 
    take?: number; 
    search?: string 
  }, skipCache = false): Promise<{ triageQueue: { total: number; tickets: any[] } }> =>
    graphqlClient.query(GraphQLQueries.GET_TRIAGE_QUEUE, { variables, skipCache }),

  createTriageTicket: (patientId: string, priority?: number): Promise<{ createTriageTicket: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_TRIAGE_TICKET, {
      variables: { patientId, priority }
    }),

  queueCall: (ticketId: string): Promise<{ queueCall: any }> =>
    graphqlClient.mutation(GraphQLMutations.QUEUE_CALL, {
      variables: { ticketId }
    }),

  queueStart: (ticketId: string): Promise<{ queueStart: any }> =>
    graphqlClient.mutation(GraphQLMutations.QUEUE_START, {
      variables: { ticketId }
    }),

  queueComplete: (ticketId: string): Promise<{ queueComplete: any }> =>
    graphqlClient.mutation(GraphQLMutations.QUEUE_COMPLETE, {
      variables: { ticketId }
    }),

  // Appointment Operations
  createAppointment: (input: {
    patientId: string;
    doctorId: string;
    appointment_time: string;
    reason?: string;
    status?: string;
  }): Promise<{ createAppointment: any }> =>
    graphqlClient.mutation(GraphQLMutations.CREATE_APPOINTMENT, {
      variables: { input }
    }),

  updateAppointment: (id: string, input: {
    status?: string;
    reason?: string;
    appointment_time?: string;
  }): Promise<{ updateAppointment: any }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_APPOINTMENT, {
      variables: { id, input }
    }),

  deleteAppointment: (id: string): Promise<{ deleteAppointment: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_APPOINTMENT, {
      variables: { id }
    }),

  // Queue Management
  deleteAllQueueTickets: (): Promise<{ deleteAllQueueTickets: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_ALL_QUEUE_TICKETS),

  deleteQueueTicketsByDate: (date: string): Promise<{ deleteQueueTicketsByDate: boolean }> =>
    graphqlClient.mutation(GraphQLMutations.DELETE_QUEUE_TICKETS_BY_DATE, {
      variables: { date }
    }),

  // Patient Vitals
  getPatientVitals: (patientId: string): Promise<{ patientVitals: any[] }> =>
    graphqlClient.query(GraphQLQueries.GET_PATIENT_VITALS, {
      variables: { patientId }
    }),

  // Notification Operations
  getStockExpiryAlerts: (variables?: { 
    skip?: number; 
    take?: number; 
    search?: string 
  }): Promise<{ stockExpiryAlerts: { total: number; items: any[] } }> =>
    graphqlClient.query(GraphQLQueries.STOCK_EXPIRY_ALERTS, { variables }),

  getTodaysAppointments: (variables?: { 
    date?: string; 
    skip?: number; 
    take?: number; 
    status?: string 
  }): Promise<{ todaysAppointments: { total: number; items: any[] } }> =>
    graphqlClient.query(GraphQLQueries.TODAYS_APPOINTMENTS, { variables }),
}; 