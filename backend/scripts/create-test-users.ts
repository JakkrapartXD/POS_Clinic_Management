#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Test users configuration
const TEST_USERS = [
  {
    username: 'nurse01',
    password: 'nurse123',
    email: 'nurse01@test.clinic',
    role: 'nurse',
    status: 'active'
  },
  {
    username: 'cashier01',
    password: 'cashier123',
    email: 'cashier01@test.clinic',
    role: 'cashier',
    status: 'active'
  },
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

async function createTestUsers() {
  console.log('🚀 Starting test users creation...\n');

  try {
    for (const userData of TEST_USERS) {
      // Check if user already exists in snclinc schema
      const existingUser = await prisma.$queryRaw`
        SELECT id, username, email, role, status
        FROM clinic_pro."User"
        -- FROM snclinc."User"
        WHERE username = ${userData.username}
      ` as any[];

      if (existingUser && existingUser.length > 0) {
        console.log(`⚠️  User '${userData.username}' already exists. Skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await hash(userData.password, 10);

      // Create user in clinic_pro schema using raw SQL (let database generate ID)
      await prisma.$executeRaw`
        INSERT INTO clinic_pro."User" (id, username, password_hash, email, role, status, created_at, updated_at)
        VALUES (gen_random_uuid()::text, ${userData.username}, ${hashedPassword}, ${userData.email}, ${userData.role}, ${userData.status}, NOW(), NOW())
      `;

      // Get the created user
      const user = await prisma.$queryRaw`
        SELECT id, username, email, role, status, created_at
        FROM clinic_pro."User"
        -- FROM snclinc."User"
        WHERE username = ${userData.username}
      ` as any[];

      const createdUser = user[0];
      console.log(`✅ Created test user: ${createdUser.username} (${createdUser.role})`);
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Status: ${createdUser.status}`);
      console.log(`   Created: ${createdUser.created_at}\n`);
    }

    console.log('🎉 All test users created successfully!');
    console.log('\n📋 Test Users Summary:');
    console.log('┌─────────────┬──────────┬─────────────────────┬────────────┐');
    console.log('│ Username    │ Role     │ Email               │ Password   │');
    console.log('├─────────────┼──────────┼─────────────────────┼────────────┤');
    
    for (const userData of TEST_USERS) {
      console.log(`│ ${userData.username.padEnd(11)} │ ${userData.role.padEnd(8)} │ ${userData.email.padEnd(19)} │ ${userData.password.padEnd(10)} │`);
    }
    
    console.log('└─────────────┴──────────┴─────────────────────┴────────────┘');
    console.log('\n💡 These users are ready for E2E testing!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestUsers()
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createTestUsers, TEST_USERS };
