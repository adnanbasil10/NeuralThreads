// Setup PostGIS extension and run migration for Tailor table
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function setupPostGIS() {
  console.log('🗺️  Setting up PostGIS for distance calculations...\n');
  
  try {
    // Step 1: Enable PostGIS extension
    console.log('Step 1: Enabling PostGIS extension...');
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ PostGIS extension enabled\n');
    } catch (error) {
      if (error.message.includes('permission denied')) {
        console.log('⚠️  Permission denied - PostGIS may already be enabled or needs admin access');
        console.log('   You may need to enable it via Supabase Dashboard → Database → Extensions\n');
      } else {
        throw error;
      }
    }

    // Step 2: Verify PostGIS is enabled
    console.log('Step 2: Verifying PostGIS...');
    try {
      const version = await prisma.$queryRawUnsafe('SELECT PostGIS_version() as version;');
      console.log('✅ PostGIS version:', version[0]?.version || 'Unknown');
      console.log('');
    } catch (error) {
      console.log('⚠️  Could not verify PostGIS version (may need to enable via Supabase Dashboard)');
      console.log('   Go to: Supabase Dashboard → Database → Extensions → Enable PostGIS\n');
    }

    // Step 3: Add locationPoint column
    console.log('Step 3: Adding locationPoint column...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Tailor" 
        ADD COLUMN IF NOT EXISTS "locationPoint" geography(Point, 4326);
      `);
      console.log('✅ locationPoint column added\n');
    } catch (error) {
      console.log('⚠️  Error adding column:', error.message);
      console.log('');
    }

    // Step 4: Backfill locationPoint from latitude/longitude
    console.log('Step 4: Backfilling locationPoint from existing coordinates...');
    try {
      const result = await prisma.$executeRawUnsafe(`
        UPDATE "Tailor"
        SET "locationPoint" = ST_SetSRID(
          ST_MakePoint(longitude, latitude),
          4326
        )::geography
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND "locationPoint" IS NULL;
      `);
      console.log('✅ Backfilled locationPoint for existing tailors\n');
    } catch (error) {
      console.log('⚠️  Error backfilling:', error.message);
      console.log('');
    }

    // Step 5: Create spatial GIST index
    console.log('Step 5: Creating spatial GIST index...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Tailor_locationPoint_idx" 
        ON "Tailor" 
        USING GIST ("locationPoint");
      `);
      console.log('✅ Spatial GIST index created\n');
    } catch (error) {
      console.log('⚠️  Error creating index:', error.message);
      console.log('');
    }

    // Step 6: Create skills GIN index
    console.log('Step 6: Creating skills GIN index...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Tailor_skills_idx" 
        ON "Tailor" 
        USING GIN (skills);
      `);
      console.log('✅ Skills GIN index created\n');
    } catch (error) {
      console.log('⚠️  Error creating skills index:', error.message);
      console.log('');
    }

    // Step 7: Verify setup
    console.log('Step 7: Verifying setup...');
    const columnCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Tailor' AND column_name = 'locationPoint';
    `);
    
    const indexCheck = await prisma.$queryRawUnsafe(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'Tailor' AND indexname LIKE '%locationPoint%';
    `);

    const tailorsWithLocation = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM "Tailor"
      WHERE "locationPoint" IS NOT NULL;
    `);

    console.log('📊 Setup Summary:');
    console.log(`   - locationPoint column: ${columnCheck.length > 0 ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - Spatial index: ${indexCheck.length > 0 ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - Tailors with location: ${tailorsWithLocation[0]?.count || 0}`);
    console.log('');

    if (columnCheck.length > 0 && indexCheck.length > 0) {
      console.log('🎉 PostGIS setup complete!');
      console.log('✅ Your database is ready for optimized distance queries');
      console.log('✅ The /api/tailors endpoint will now use PostGIS for distance calculations');
    } else {
      console.log('⚠️  Setup incomplete - some steps may need manual intervention');
      console.log('   Check Supabase Dashboard → Database → Extensions for PostGIS');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure you have database admin permissions');
    console.error('2. Enable PostGIS via Supabase Dashboard if needed');
    console.error('3. Check Supabase project limits');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPostGIS();

