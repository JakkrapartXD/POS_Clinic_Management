export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'staff' | 'cashier';
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  // Add any additional profile-specific fields here
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  role?: 'admin' | 'doctor' | 'staff' | 'cashier';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
} 