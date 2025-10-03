
#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/test_clinic_db'
    }
  }
});

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete test data in reverse order of dependencies
    await prisma.payment.deleteMany({
      where: { 
        OR: [
          { order: { patient: { first_name: { contains: 'Test' } } } },
          { order: { patient: { first_name: { contains: 'test' } } } }
        ]
      }
    });
    
    await prisma.orderItem.deleteMany({
      where: { 
        OR: [
          { order: { patient: { first_name: { contains: 'Test' } } } },
          { order: { patient: { first_name: { contains: 'test' } } } }
        ]
      }
    });
    
    await prisma.order.deleteMany({
      where: { 
        OR: [
          { patient: { first_name: { contains: 'Test' } } },
          { patient: { first_name: { contains: 'test' } } }
        ]
      }
    });
    
    await prisma.visit.deleteMany({
      where: { 
        OR: [
          { patient: { first_name: { contains: 'Test' } } },
          { patient: { first_name: { contains: 'test' } } }
        ]
      }
    });
    
    await prisma.patient.deleteMany({
      where: { 
        OR: [
          { first_name: { contains: 'Test' } },
          { first_name: { contains: 'test' } }
        ]
      }
    });
    
    await prisma.user.deleteMany({
      where: { 
        OR: [
          { username: { contains: 'test' } },
          { username: { contains: 'Test' } }
        ]
      }
    });
    
    await prisma.product.deleteMany({
      where: { 
        OR: [
          { product_name: { contains: 'Test' } },
          { product_name: { contains: 'test' } }
        ]
      }
    });
    
    await prisma.category.deleteMany({
      where: { 
        OR: [
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } }
        ]
      }
    });
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
