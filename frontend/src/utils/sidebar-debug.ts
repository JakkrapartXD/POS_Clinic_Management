/**
 * Sidebar debugging utilities
 */

import { UserRole } from '@/config/role-permissions';

/**
 * Test sidebar menu visibility for different roles
 */
export const testSidebarMenuVisibility = (): void => {
  console.log('🧪 Testing sidebar menu visibility for all roles...');
  
  const roles: UserRole[] = ['admin', 'cashier', 'pharmacist', 'doctor', 'staff'];
  
  roles.forEach(role => {
    console.log(`\n📋 Role: ${role}`);
    
    // Import getMenuItemsForRole dynamically
    import('@/config/role-permissions').then(({ getMenuItemsForRole }) => {
      const allowedItems = getMenuItemsForRole(role);
      console.log(`  Allowed menu items:`, allowedItems);
      
      // Show what each role can see
      const menuLabels = {
        'notifications': 'แจ้งเตือน',
        'pos': 'จุดขาย',
        'inventory': 'คลังสินค้า',
        'discounts': 'ส่วนลด',
        'documents': 'เอกสาร',
        'users': 'ผู้ใช้งาน',
        'orders': 'ใบเสร็จรับเงินวันนี้',
        'reports': 'รายงาน',
        'settings': 'ตั้งค่า',
        'admin/users': 'จัดการผู้ใช้'
      };
      
      const visibleLabels = allowedItems.map(item => menuLabels[item as keyof typeof menuLabels] || item);
      console.log(`  Visible menus:`, visibleLabels);
    });
  });
};

/**
 * Simulate user role change
 */
export const simulateUserRoleChange = (newRole: UserRole): void => {
  console.log(`🔄 Simulating user role change to: ${newRole}`);
  
  // Trigger a custom event that sidebar can listen to
  const event = new CustomEvent('userRoleChanged', { 
    detail: { role: newRole } 
  });
  window.dispatchEvent(event);
  
  console.log('📡 User role change event dispatched');
};

/**
 * Check current sidebar state
 */
export const checkSidebarState = (): void => {
  console.log('🔍 Checking current sidebar state...');
  
  // Check if sidebar element exists
  const sidebar = document.querySelector('[data-testid="sidebar"]') || 
                  document.querySelector('.sidebar') ||
                  document.querySelector('nav');
  
  if (sidebar) {
    console.log('✅ Sidebar element found');
    
    // Check visible menu items
    const menuItems = sidebar.querySelectorAll('[data-menu-item]');
    console.log(`📋 Visible menu items: ${menuItems.length}`);
    
    menuItems.forEach((item, index) => {
      const label = item.textContent?.trim();
      const isActive = item.classList.contains('bg-purple-100');
      console.log(`  ${index + 1}. ${label} ${isActive ? '(ACTIVE)' : ''}`);
    });
  } else {
    console.log('❌ Sidebar element not found');
  }
};

/**
 * Force sidebar refresh
 */
export const forceSidebarRefresh = (): void => {
  console.log('🔄 Forcing sidebar refresh...');
  
  // Trigger window focus event (which should refresh user data)
  window.dispatchEvent(new Event('focus'));
  
  // Trigger storage change event
  localStorage.setItem('user_changed', Date.now().toString());
  localStorage.removeItem('user_changed');
  
  console.log('📡 Sidebar refresh events dispatched');
};

/**
 * Run all sidebar tests
 */
export const runSidebarTests = (): void => {
  console.log('🚀 Running all sidebar tests...');
  
  testSidebarMenuVisibility();
  
  setTimeout(() => {
    checkSidebarState();
  }, 1000);
  
  setTimeout(() => {
    forceSidebarRefresh();
  }, 2000);
  
  console.log('🏁 Sidebar tests completed');
};
