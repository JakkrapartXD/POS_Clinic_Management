export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'staff' | 'cashier' | 'pharmacist';
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  // Add any additional profile-specific fields here
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  role?: 'admin' | 'doctor' | 'staff' | 'cashier' | 'pharmacist';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UsersResponse {
  users: User[];
  total: number;
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