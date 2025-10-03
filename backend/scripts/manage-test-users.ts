#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Test users configuration
const TEST_USERS = [
  {
    username: 'staff01',
    password: 'staff123',
    email: 'staff01@test.clinic',
    role: 'staff',
    status: 'active'
  },
  {
    username: 'doctor01',
    password: 'doctor123',
    email: 'doctor01@test.clinic',
    role: 'doctor',
    status: 'active'
  },
  {
    username: 'pharmacist01',
    password: 'pharmacist123',
    email: 'pharmacist01@test.clinic',
    role: 'pharmacist',
    status: 'active'
  }
] as const;

async function listTestUsers() {
  console.log('📋 Listing test users...\n');

  try {
    const usernames = TEST_USERS.map(u => u.username);
    const users = await prisma.$queryRaw`
      SELECT id, username, email, role, status, created_at
      FROM clinic_dev."User"
      WHERE username = ANY(${usernames})
      ORDER BY username ASC
    ` as any[];

    if (users.length === 0) {
      console.log('❌ No test users found in the system.');
      return;
    }

    console.log('✅ Found test users:');
    console.log('┌─────────────┬──────────┬─────────────────────┬────────────┬─────────────────────┐');
    console.log('│ Username    │ Role     │ Email               │ Status     │ Created             │');
    console.log('├─────────────┼──────────┼─────────────────────┼────────────┼─────────────────────┤');
    
    for (const user of users) {
      console.log(`│ ${user.username.padEnd(11)} │ ${user.role.padEnd(8)} │ ${user.email.padEnd(19)} │ ${user.status.padEnd(10)} │ ${user.created_at.toISOString().split('T')[0].padEnd(19)} │`);
    }
    
    console.log('└─────────────┴──────────┴─────────────────────┴────────────┴─────────────────────┘');

  } catch (error) {
    console.error('❌ Error listing test users:', error);
  }
}

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  try {
    for (const userData of TEST_USERS) {
      // Check if user already exists in clinic_dev schema
      const existingUser = await prisma.$queryRaw`
        SELECT id, username, email, role, status
        FROM clinic_dev."User"
        WHERE username = ${userData.username}
      ` as any[];

      if (existingUser && existingUser.length > 0) {
        console.log(`⚠️  User '${userData.username}' already exists. Skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await hash(userData.password, 10);

      // Create user in clinic_dev schema using raw SQL (let database generate ID)
      await prisma.$executeRaw`
        INSERT INTO clinic_dev."User" (username, password_hash, email, role, status, created_at, updated_at)
        VALUES (${userData.username}, ${hashedPassword}, ${userData.email}, ${userData.role}, ${userData.status}, NOW(), NOW())
      `;

      console.log(`✅ Created test user: ${userData.username} (${userData.role})`);
    }

    console.log('\n🎉 All test users created successfully!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
}

async function deleteTestUsers() {
  console.log('🗑️  Deleting test users...\n');

  try {
    let deletedCount = 0;

    for (const userData of TEST_USERS) {
      // Check if user exists in clinic_dev schema
      const existingUser = await prisma.$queryRaw`
        SELECT id, username, email, role, status
        FROM clinic_dev."User"
        WHERE username = ${userData.username}
      ` as any[];

      if (!existingUser || existingUser.length === 0) {
        console.log(`⚠️  User '${userData.username}' not found. Skipping...`);
        continue;
      }

      // Delete user from clinic_dev schema
      await prisma.$executeRaw`
        DELETE FROM clinic_dev."User"
        WHERE username = ${userData.username}
      `;

      console.log(`✅ Deleted test user: ${userData.username} (${userData.role})`);
      deletedCount++;
    }

    console.log(`\n🎉 Deleted ${deletedCount} test users successfully!`);

  } catch (error) {
    console.error('❌ Error deleting test users:', error);
  }
}

async function resetTestUsers() {
  console.log('🔄 Resetting test users (delete + create)...\n');
  
  await deleteTestUsers();
  console.log('');
  await createTestUsers();
}

function showHelp() {
  console.log('🛠️  Test Users Management Script\n');
  console.log('Usage: npm run test-users <command>\n');
  console.log('Commands:');
  console.log('  list     - List all test users in the system');
  console.log('  create   - Create test users (staff01, doctor01, pharmacist01)');
  console.log('  delete   - Delete all test users');
  console.log('  reset    - Delete and recreate all test users');
  console.log('  help     - Show this help message\n');
  console.log('Examples:');
  console.log('  npm run test-users list');
  console.log('  npm run test-users create');
  console.log('  npm run test-users delete');
  console.log('  npm run test-users reset\n');
  console.log('Test Users:');
  console.log('┌─────────────┬──────────┬─────────────────────┬────────────┐');
  console.log('│ Username    │ Role     │ Email               │ Password   │');
  console.log('├─────────────┼──────────┼─────────────────────┼────────────┤');
  
  for (const userData of TEST_USERS) {
    console.log(`│ ${userData.username.padEnd(11)} │ ${userData.role.padEnd(8)} │ ${userData.email.padEnd(19)} │ ${userData.password.padEnd(10)} │`);
  }
  
  console.log('└─────────────┴──────────┴─────────────────────┴────────────┘');
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'list':
        await listTestUsers();
        break;
      case 'create':
        await createTestUsers();
        break;
      case 'delete':
        await deleteTestUsers();
        break;
      case 'reset':
        await resetTestUsers();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.log('❌ Invalid command. Use "help" to see available commands.\n');
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { listTestUsers, createTestUsers, deleteTestUsers, resetTestUsers, TEST_USERS };
