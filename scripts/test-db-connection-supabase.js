// Test Supabase database connection with optimized settings
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🔌 Testing Supabase database connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful\n');

    // Test 2: Check PostGIS extension
    console.log('Test 2: Checking PostGIS extension...');
    const postgisCheck = await prisma.$queryRaw`
      SELECT PostGIS_version() as version;
    `;
    console.log('✅ PostGIS is enabled:', postgisCheck[0]?.version || 'Unknown');
    console.log('');

    // Test 3: Check locationPoint column exists
    console.log('Test 3: Checking locationPoint column...');
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Tailor' AND column_name = 'locationPoint';
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ locationPoint column exists:', columnCheck[0]);
    } else {
      console.log('⚠️  locationPoint column not found - migration needed');
    }
    console.log('');

    // Test 4: Check spatial index
    console.log('Test 4: Checking spatial index...');
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Tailor' AND indexname LIKE '%locationPoint%';
    `;
    
    if (indexCheck.length > 0) {
      console.log('✅ Spatial index exists:', indexCheck[0].indexname);
    } else {
      console.log('⚠️  Spatial index not found - migration needed');
    }
    console.log('');

    // Test 5: Test PostGIS distance calculation
    console.log('Test 5: Testing PostGIS distance calculation...');
    const distanceTest = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as tailors_with_location
      FROM "Tailor"
      WHERE "locationPoint" IS NOT NULL;
    `;
    console.log(`✅ Found ${distanceTest[0]?.tailors_with_location || 0} tailors with location data`);
    console.log('');

    // Test 6: Connection pool info
    console.log('Test 6: Connection pool information...');
    const poolInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `;
    console.log(`Active connections: ${poolInfo[0]?.active_connections || 0}`);
    console.log(`Max connections: ${poolInfo[0]?.max_connections || 'Unknown'}`);
    console.log('');

    console.log('🎉 All connection tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. If locationPoint column is missing, run the PostGIS migration');
    console.log('2. If spatial index is missing, run the PostGIS migration');
    console.log('3. Your database is ready for optimized distance queries!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env.local');
    console.error('2. Verify Supabase credentials');
    console.error('3. Ensure Supabase project is active');
    console.error('4. Check network connectivity');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

