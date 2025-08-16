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