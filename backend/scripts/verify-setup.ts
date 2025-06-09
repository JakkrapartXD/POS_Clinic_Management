#!/usr/bin/env bun

/**
 * Setup verification script for SN Medical API
 * This script tests the GraphQL API functionality and security features
 */

import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";

async function verifySetup() {
  console.log("🔍 Verifying SN Medical API Setup...\n");

  // Test 1: Environment Variables
  console.log("1. Checking Environment Variables...");
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL'
  ];

  let envCheck = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`   ❌ Missing: ${envVar}`);
      envCheck = false;
    } else {
      console.log(`   ✅ Found: ${envVar}`);
    }
  }

  if (!envCheck) {
    console.log("\n❌ Environment setup incomplete. Please check your .env file.\n");
    process.exit(1);
  }

  // Test 2: Database Connection
  console.log("\n2. Testing Database Connection...");
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log("   ✅ Database connection successful");
    await prisma.$disconnect();
  } catch (error) {
    console.log("   ❌ Database connection failed:");
    console.log(`      ${error}`);
    process.exit(1);
  }

  // Test 3: Redis Connection
  console.log("\n3. Testing Redis Connection...");
  try {
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
    await redisClient.ping();
    console.log("   ✅ Redis connection successful");
    await redisClient.quit();
  } catch (error) {
    console.log("   ❌ Redis connection failed:");
    console.log(`      ${error}`);
    console.log("   💡 Make sure Redis server is running");
    process.exit(1);
  }

  // Test 4: GraphQL Schema Validation
  console.log("\n4. Validating GraphQL Schema...");
  try {
    const { typeDefs } = await import("../src/graphql/schema");
    const { resolvers } = await import("../src/graphql/resolvers");
    
    if (typeDefs && resolvers) {
      console.log("   ✅ GraphQL schema and resolvers loaded");
      console.log(`   📊 Schema contains ${typeDefs.split('type ').length - 1} types`);
      console.log(`   🔧 Resolvers contain ${Object.keys(resolvers.Query || {}).length} queries`);
      console.log(`   ⚡ Resolvers contain ${Object.keys(resolvers.Mutation || {}).length} mutations`);
    }
  } catch (error) {
    console.log("   ❌ GraphQL schema validation failed:");
    console.log(`      ${error}`);
    process.exit(1);
  }

  // Test 5: Security Features
  console.log("\n5. Checking Security Features...");
  try {
    const { SecurityService } = await import("../src/graphql/security");
    
    // Test email validation
    const validEmail = SecurityService.validateEmail("test@example.com");
    const invalidEmail = SecurityService.validateEmail("invalid-email");
    
    if (validEmail && !invalidEmail) {
      console.log("   ✅ Email validation working");
    }
    
    // Test string sanitization
    const sanitized = SecurityService.sanitizeString("<script>alert('xss')</script>Hello");
    if (!sanitized.includes('<script>')) {
      console.log("   ✅ XSS protection working");
    }
    
    // Test ID validation
    try {
      SecurityService.validateId("invalid-id");
      console.log("   ❌ ID validation not working");
    } catch {
      console.log("   ✅ ID validation working");
    }
    
  } catch (error) {
    console.log("   ❌ Security features check failed:");
    console.log(`      ${error}`);
  }

  // Test 6: Server Dependencies
  console.log("\n6. Checking Server Dependencies...");
  try {
    const dependencies = [
      "elysia",
      "@elysiajs/graphql-yoga", 
      "graphql-yoga",
      "bcrypt",
      "jsonwebtoken"
    ];
    
    for (const dep of dependencies) {
      try {
        await import(dep);
        console.log(`   ✅ ${dep} available`);
      } catch {
        console.log(`   ❌ ${dep} not found`);
      }
    }
  } catch (error) {
    console.log("   ⚠️  Dependency check failed");
  }

  console.log("\n🎉 Setup verification complete!");
  console.log("\n🚀 Ready to start the server with: bun run dev");
  console.log("📖 Check README.md for API documentation");
  console.log("🔗 GraphQL endpoint will be available at: http://localhost:4000/graphql\n");
}

// Run verification
verifySetup().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
}); 