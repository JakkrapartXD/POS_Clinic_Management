export type UserRole = 'admin' | 'doctor' | 'staff' | 'cashier' | 'pharmacist' | 'nurse'

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
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
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
      'visits',
      'queue', 
      'queue/triage',
      'queue/doctor',
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
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
      'documents',
      'users'
    ],
    menuItems: [
      'notifications',
      'pos',
      'inventory',
      'patients',
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
      'documents',
      'users'
    ]
  },
  staff: {
    allowedPages: [
      'notifications',
      'patients',
      'visits',
      'queue',
      'queue/triage',
      'queue/doctor',
      'orders',
      'reports'
    ],
    menuItems: [
      'notifications',
      'patients',
      'visits',
      'queue', 
      'queue/triage',
      'queue/doctor',
      'orders',
      'reports'
    ]
  },
  nurse: {
    allowedPages: [
      'notifications',
      'patients',
      'queue',
      'queue/triage'
    ],
    menuItems: [
      'notifications',
      'patients',
      'queue',
      'queue/triage'
    ]
  }
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  // Handle permission format like "patients:read" -> "patients"
  const page = permission.includes(':') ? permission.split(':')[0] : permission;
  return ROLE_PERMISSIONS[userRole]?.allowedPages.includes(page) || false
}

export function getMenuItemsForRole(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole]?.menuItems || []
} 