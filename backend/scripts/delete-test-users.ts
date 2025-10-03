#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test users to delete
const TEST_USERNAMES = ['staff01', 'doctor01', 'pharmacist01'] as const;

async function deleteTestUsers() {
  console.log('🗑️  Starting test users deletion...\n');

  try {
    let deletedCount = 0;
    let skippedCount = 0;

    for (const username of TEST_USERNAMES) {
      // Check if user exists in clinic_dev schema
      const existingUser = await prisma.$queryRaw`
        SELECT id, username, email, role, status
        FROM clinic_dev."User"
        WHERE username = ${username}
      ` as any[];

      if (!existingUser || existingUser.length === 0) {
        console.log(`⚠️  User '${username}' not found. Skipping...`);
        skippedCount++;
        continue;
      }

      // Delete user from clinic_dev schema
      await prisma.$executeRaw`
        DELETE FROM clinic_dev."User"
        WHERE username = ${username}
      `;

      const user = existingUser[0];
      console.log(`✅ Deleted test user: ${user.username} (${user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}\n`);
      
      deletedCount++;
    }

    console.log('🎉 Test users deletion completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Deleted: ${deletedCount} users`);
    console.log(`   ⚠️  Skipped: ${skippedCount} users (not found)`);
    
    if (deletedCount > 0) {
      console.log('\n💡 Test users have been removed from the system.');
    } else {
      console.log('\n💡 No test users were found to delete.');
    }

  } catch (error) {
    console.error('❌ Error deleting test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  deleteTestUsers()
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { deleteTestUsers, TEST_USERNAMES };
