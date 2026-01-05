/**
 * Database Connection Test Script
 * Run with: node scripts/test-db-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    console.log('\nPlease add DATABASE_URL to your .env.local file:');
    console.log('DATABASE_URL="postgresql://user:password@host:port/database"');
    process.exit(1);
  }

  // Parse connection string (hide password)
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('📋 Connection Details:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432 (default)'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
    console.log(`   Password: ${url.password ? '***' : 'Not set'}`);
    console.log('');
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format');
    console.error('Expected format: postgresql://user:password@host:port/database');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔄 Attempting to connect...');
    
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!\n');
    
    // Test if tables exist
    console.log('🔍 Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`);
      tables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. You may need to run: npm run db:push');
    }
    
    console.log('\n✅ All checks passed!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);
    
    // Provide helpful suggestions
    if (error.message.includes('P1001') || error.message.includes("Can't reach database server")) {
      console.log('\n💡 Suggestions:');
      console.log('   1. Check if your Supabase project is active');
      console.log('   2. Verify the database host is correct');
      console.log('   3. Check your internet connection');
      console.log('   4. Ensure Supabase database is not paused');
    } else if (error.message.includes('P1000') || error.message.includes('Authentication failed')) {
      console.log('\n💡 Suggestions:');
      console.log('   1. Verify your database password is correct');
      console.log('   2. Check if the password is URL-encoded (use %40 for @)');
      console.log('   3. Ensure the username is correct');
    } else if (error.message.includes('P1003') || error.message.includes('does not exist')) {
      console.log('\n💡 Suggestions:');
      console.log('   1. Verify the database name in your connection string');
      console.log('   2. Create the database if it does not exist');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

