import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if any users exist in the system
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    // Set admin credentials (preferably use environment variables in production)
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    try {
      // Hash the password
      const hashedPassword = await hash(adminPassword, 10);

      // Create the admin user
      const admin = await prisma.user.create({
        data: {
          username: adminUsername,
          password_hash: hashedPassword,
          role: 'admin',
          email: `${adminUsername}@clinic.system`,
          status: 'active',
        },
      });

      console.log(`✅ Admin user created successfully: ${admin.username} (${admin.id})`);

    } catch (error) {
      console.error('❌ Error creating admin user:', error);
    }
  } else {
    console.log('👥 Admin user already exists. Skipping admin creation.');
  }

  // Check if categories exist
  const categoryCount = await prisma.category.count();
  
  if (categoryCount === 0) {
    console.log('📁 Creating default categories...');
    
    const defaultCategories = [
      {
        name: 'เวชภัณฑ์ / เครื่องมือแพทย์',
        description: 'MEDICAL SUPPLIES / EQUIPMENT',
        code: 'MED001'
      },
      {
        name: 'เม็ดเดียด อื่นๆ',
        description: 'OTHER',
        code: 'OTH001'
      },
      {
        name: 'เครื่องสำอาง / ผลิตภัณฑ์บำรุงผิว',
        description: 'COSMETICS',
        code: 'COS001'
      },
      {
        name: 'สมุนไพร / แผนโบราณ',
        description: 'HERBAL',
        code: 'HER001'
      },
      {
        name: 'วิตามิน / อาหารเสริม / อาหารทางการแพทย์',
        description: 'SUPPLEMENTS',
        code: 'SUP001'
      },
      {
        name: 'วัตถุอันตราย',
        description: 'ใส่พบคำอธิบาย',
        code: null
      },
      {
        name: 'ยาใช้เฉพาะที่',
        description: 'TOPICAL MEDICATION',
        code: 'TOP001'
      },
      {
        name: 'ยาใช้ภายใน',
        description: 'ใส่พบคำอธิบาย',
        code: null
      },
      {
        name: 'ยาใช้ภายนอก',
        description: 'DRUG FOR EXTERNAL USE',
        code: 'EXT001'
      },
      {
        name: 'ยาแผนโบราณ',
        description: 'ใส่พบคำอธิบาย',
        code: null
      },
      {
        name: 'ยาแผนปัจจุบัน',
        description: 'ใส่พบคำอธิบาย',
        code: null
      },
      {
        name: 'ยาอันตราย',
        description: 'PRESCRIPTION',
        code: 'PRE001'
      },
      {
        name: 'ยาสามัญประจำบ้าน',
        description: 'HOUSEHOLD',
        code: 'HOU001'
      },
      {
        name: 'ยาบรรจุเสร็จ',
        description: 'NONPRESCRIPTION',
        code: 'NON001'
      },
      {
        name: 'ยาอื่น',
        description: 'ใส่พบคำอธิบาย',
        code: null
      },
      {
        name: 'ยาควบคุมพิเศษ',
        description: 'RESTRICT',
        code: 'RES001'
      }
    ];

    try {
      for (const category of defaultCategories) {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ Created category: ${category.name}`);
      }
      console.log(`📁 Successfully created ${defaultCategories.length} default categories.`);
    } catch (error) {
      console.error('❌ Error creating categories:', error);
    }
  } else {
    console.log('📁 Categories already exist. Skipping category creation.');
  }

  // Check if service products exist
  const serviceProducts = await prisma.product.findMany({
    where: { product_type: 'service' }
  });

  if (serviceProducts.length === 0) {
    console.log('🏥 Creating clinic service products...');
    
    // Find or create a service category
    let serviceCategory = await prisma.category.findFirst({
      where: { name: { contains: 'บริการ' } }
    });

    if (!serviceCategory) {
      serviceCategory = await prisma.category.create({
        data: {
          name: 'บริการทางการแพทย์',
          description: 'MEDICAL SERVICES',
          code: 'SRV001'
        }
      });
      console.log('✅ Created service category');
    }

    const defaultServices = [
      {
        product_name: 'ค่าตรวจ',
        product_type: 'service',
        sku: 'S001',
        sale_price: 200.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'ค่าตรวจ',
        stock_quantity: 9999999, // Services don't have stock limits
        vat_percent: 0 // No VAT for medical services
      },
      {
        product_name: 'ทำแผล',
        product_type: 'service',
        sku: 'S002',
        sale_price: 150.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'ทำแผล',
        stock_quantity: 9999999, // Services don't have stock limits
        vat_percent: 0 // No VAT for medical services
      },
      {
        product_name: 'ฉีดยา',
        product_type: 'service',
        sku: 'S003',
        sale_price: 100.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'ฉีดยา',
        stock_quantity: 9999999,
        vat_percent: 0
      },
      {
        product_name: 'วัดความดัน',
        product_type: 'service',
        sku: 'S004',
        sale_price: 50.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'วัดความดัน',
        stock_quantity: 9999999,
        vat_percent: 0
      },
      {
        product_name: 'วัดน้ำตาล',
        product_type: 'service',
        sku: 'S005',
        sale_price: 80.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'วัดน้ำตาล',
        stock_quantity: 9999999,
        vat_percent: 0
      },
      {
        product_name: 'ให้คำปรึกษา',
        product_type: 'service',
        sku: 'S006',
        sale_price: 300.0,
        cost: 0.0,
        status: 'active',
        categoryId: serviceCategory.id,
        unit: 'ครั้ง',
        short_name: 'ให้คำปรึกษา',
        stock_quantity: 9999999,
        vat_percent: 0
      }
    ];

    try {
      for (const service of defaultServices) {
        const createdService = await prisma.product.create({
          data: service
        });
        console.log(`✅ Created service: ${service.product_name} (${createdService.id})`);
        
        // Create initial stock for the service
        await prisma.stock.create({
          data: {
            productId: createdService.id,
            quantity: 9999999, // Unlimited stock for services
            quantity_in: 9999999,
            production_date: null, // No production date for services
            expiration_date: null, // No expiration date for services
            note: 'สต๊อกเริ่มต้นสำหรับบริการทางการแพทย์',
            is_outofstock: false
          }
        });
        console.log(`📦 Created initial stock for service: ${service.product_name}`);
      }
      console.log(`🏥 Successfully created ${defaultServices.length} clinic services with stock.`);
    } catch (error) {
      console.error('❌ Error creating service products:', error);
    }
  } else {
    console.log(`🏥 Found ${serviceProducts.length} existing service products. Skipping service creation.`);
  }
}

// Execute the script
main()
  .catch((e) => {
    console.error('❌ Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  });