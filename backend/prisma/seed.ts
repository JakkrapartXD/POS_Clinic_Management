import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if any users exist in the system
  const userCount = await prisma.user.count();
  
  if (userCount > 0) {
    console.log('👥 Users already exist in the system. Skipping admin creation.');
    return;
  }
  
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