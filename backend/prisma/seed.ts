import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Get admin credentials from environment variables
  const adminUsername = process.env.SNADMIN_Username;
  const adminPassword = process.env.SNADMIN_Password;

  if (!adminUsername || !adminPassword) {
    console.warn('⚠️ SNADMIN_Username or SNADMIN_Password not set in environment variables. Skipping admin user creation.');
    return;
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (existingAdmin) {
      console.log(`👤 Admin user '${adminUsername}' already exists.`);
      return;
    }

    // Hash the password
    const hashedPassword = await hash(adminPassword, 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: 'admin',
        name: 'System Administrator',
        email: `${adminUsername}@snclinc.system`,
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