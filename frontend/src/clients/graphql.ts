import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { getCookie } from '@/utils/common';
import { APP_CONSTANTS } from '@/constants';
import { User, UserProfile, UpdateUserInput, UsersResponse, ChangePasswordResponse } from '@/types/user';
import { logger } from '@/lib/logger';

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

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoint = API_CONFIG.ENDPOINTS.GRAPHQL;
    this.timeout = API_CONFIG.TIMEOUT;
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
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        logger.error('GraphQL operation returned errors', result.errors, 'GRAPHQL');
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      logger.api.error(url, error);
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
};

export const GraphQLMutations = {
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
};

// Typed GraphQL API functions
export const GraphQLAPI = {
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
}; 