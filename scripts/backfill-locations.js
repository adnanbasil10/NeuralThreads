
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting PostGIS location backfill...');

    try {
        // Enable PostGIS
        try {
            await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis;`;
            console.log('✅ PostGIS extension confirmed.');
        } catch (e) {
            console.log('⚠️ Could not create extension (might need superuser), hoping it exists or is not needed if using unmanaged DB.');
            console.error(e);
        }

        // Backfill data
        const result = await prisma.$executeRaw`
      UPDATE "Tailor"
      SET "locationPoint" = ST_SetSRID(
        ST_MakePoint(longitude, latitude),
        4326
      )::geography
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND "locationPoint" IS NULL;
    `;

        console.log(`✅ Backfill completed. Update result: ${result}`);
    } catch (e) {
        console.error('❌ Backfill failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
