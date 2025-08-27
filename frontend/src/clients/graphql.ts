import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { getCookie } from '@/utils/common';
import { APP_CONSTANTS } from '@/constants';
import { User, UserProfile, UpdateUserInput, UsersResponse, ChangePasswordResponse } from '@/types/user';
import { logger } from '@/lib/logger';
import { MappedProductData, ImportResult, ImportSettings } from '@/types/csv-import';
import { handleAuthError } from '@/utils/auth';

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
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface CreatePatientInput {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface UpdatePatientInput {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
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
}

class GraphQLClient {
  private baseURL: string;
  private endpoint: string;
  private timeout: number;
  private authErrorHandler?: (error: any) => void;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoint = API_CONFIG.ENDPOINTS.GRAPHQL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Set authentication error handler
  setAuthErrorHandler(handler: (error: any) => void) {
    this.authErrorHandler = handler;
  }

  private async request<T>(
    query: string,
    options: GraphQLRequestOptions = {}
  ): Promise<T> {
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
    }
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
          date_of_birth
          gender
          phone
          email
          address
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
        phone
        email
        date_of_birth
        gender
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
          sale_price
          unit
          pack_size
          stock_quantity
          sku
          barcode
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
            product {
              id
              product_name
              sku
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
            product {
              id
              product_name
              sku
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
            product {
              id
              product_name
              sku
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

  STOCK_MOVEMENTS: `
    query StockMovements($productId: String, $pagination: PaginationInput) {
      stockMovements(productId: $productId, pagination: $pagination) {
        id
        movement_type
        quantity
        reference_table
        reference_id
        note
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
        category {
          name
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
        movement_type
        quantity
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
};

// Typed GraphQL API functions
export const GraphQLAPI = {
  // Authentication error handler
  setAuthErrorHandler: (handler: (error: any) => void) => 
    graphqlClient.setAuthErrorHandler(handler),

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

  // Order Operations
  getAllOrders: (variables?: { filter?: any; pagination?: PaginationInput }): Promise<{ orders: any }> =>
    graphqlClient.query(GraphQLQueries.ALL_ORDERS, { variables }),

  getTodayOrders: (variables?: { date_from?: string; date_to?: string }): Promise<{ orders: any }> =>
    graphqlClient.query(GraphQLQueries.TODAY_ORDERS, { variables }),

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

  getStockMovements: (variables?: { productId?: string; pagination?: any }): Promise<{ stockMovements: any[] }> =>
    graphqlClient.query(GraphQLQueries.STOCK_MOVEMENTS, { variables }),

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
}; 