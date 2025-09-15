export type UserRole = 'admin' | 'doctor' | 'staff' | 'cashier' | 'pharmacist'

export interface MenuItem {
  id: string
  icon: any
  href: string
  label: string
}

export interface RolePermissions {
  allowedPages: string[]
  menuItems: string[]
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    allowedPages: [
      'notifications',
      'pos', 
      'inventory',
      'patients',
      'documents',
      'users',
      'orders',
      'reports',
      'settings',
      'admin',
      'admin/users'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory',
      'patients', 
      'documents',
      'users',
      'orders',
      'reports',
      'settings',
      'admin/users'
    ]
  },
  cashier: {
    allowedPages: [
      'notifications',
      'pos',
      'inventory'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory'
    ]
  },
  pharmacist: {
    allowedPages: [
      'notifications',
      'pos',
      'inventory'
    ],
    menuItems: [
      'notifications',
      'pos', 
      'inventory'
    ]
  },
  doctor: {
    allowedPages: [
      'notifications',
      'pos',
      'inventory',
      'patients',
      'documents',
      'users'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory',
      'patients',
      'documents',
      'users'
    ]
  },
  staff: {
    allowedPages: [
      'notifications',
      'patients',
      'orders',
      'reports'
    ],
    menuItems: [
      'notifications',
      'patients', 
      'orders',
      'reports'
    ]
  }
}

export function hasPermission(userRole: UserRole, page: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.allowedPages.includes(page) || false
}

export function getMenuItemsForRole(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole]?.menuItems || []
} 