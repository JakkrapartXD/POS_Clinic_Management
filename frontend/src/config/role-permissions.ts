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
      'discounts',
      'documents',
      'users',
      'orders',
      'reports',
      'reports/advanced',
      'settings',
      'admin/users'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory', 
      'discounts',
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
      'documents',
      'users'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory',
      'documents',
      'users'
    ]
  },
  staff: {
    allowedPages: [
      'notifications',
      'orders',
      'reports',
      'reports/advanced'
    ],
    menuItems: [
      'notifications', 
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