import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your .env.local file');
  console.error('Example: DATABASE_URL="postgresql://user:password@localhost:5432/neural_threads"');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors in production for speed
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

// Test database connection on initialization
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      console.error('Please check:');
      console.error('1. DATABASE_URL is set correctly in .env.local');
      console.error('2. Database server is running');
      console.error('3. Database credentials are correct');
      console.error('4. Database exists and is accessible');
    });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;


