import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { getCookie } from '@/utils/common';
import { APP_CONSTANTS } from '@/constants';
import { User, UserProfile, UpdateUserInput, UsersResponse, ChangePasswordResponse } from '@/types/user';

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
    const token = getCookie(APP_CONSTANTS.COOKIES.AUTH_TOKEN);
    const url = `${this.baseURL}${this.endpoint}`;

    // Debug: Log cookie information
    console.log('=== GraphQL Request Debug ===');
    console.log('Looking for cookie:', APP_CONSTANTS.COOKIES.AUTH_TOKEN);
    console.log('Token from getCookie:', token);
    console.log('All cookies:', document.cookie);
    console.log('============================');

    const body = {
      query: query.trim(),
      variables: options.variables || {},
      ...(options.operationName && { operationName: options.operationName }),
    };

    // Prepare headers - ensure we send both Authorization header AND include cookies
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header');
    } else {
      console.log('No token found, relying on HttpOnly cookies');
    }

    const config: RequestInit = {
      method: 'POST',
      credentials: 'include', // This ensures cookies are sent
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
        console.error('GraphQL Errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL Request Error:', error);
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
        createdAt
        updatedAt
      }
    }
  `,

  // Get all users (admin only)
  ALL_USERS: `
    query AllUsers($page: Int, $limit: Int) {
      users(page: $page, limit: $limit) {
        users {
          id
          username
          email
          role
          status
          createdAt
        }
        total
        page
        limit
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
};

// Typed GraphQL API functions
export const GraphQLAPI = {
  // User operations
  getCurrentUser: (): Promise<{ me: User }> => 
    graphqlClient.query(GraphQLQueries.ME),

  getUserProfile: (): Promise<{ me: UserProfile }> => 
    graphqlClient.query(GraphQLQueries.USER_PROFILE),

  getAllUsers: (variables?: { page?: number; limit?: number }): Promise<UsersResponse> =>
    graphqlClient.query(GraphQLQueries.ALL_USERS, { variables }),

  updateProfile: (input: UpdateUserInput): Promise<{ updateUser: User }> =>
    graphqlClient.mutation(GraphQLMutations.UPDATE_PROFILE, { 
      variables: { input } 
    }),

  changePassword: (oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> =>
    graphqlClient.mutation(GraphQLMutations.CHANGE_PASSWORD, {
      variables: { oldPassword, newPassword }
    }),
}; 