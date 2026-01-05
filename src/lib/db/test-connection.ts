import { prisma } from './prisma';

/**
 * Test database connection
 * Returns true if connection is successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: string;
}> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide helpful error messages based on common issues
    let details = '';
    if (errorMessage.includes('P1001') || errorMessage.includes('Can\'t reach database server')) {
      details = 'Database server is not running or not accessible. Please check if PostgreSQL is running.';
    } else if (errorMessage.includes('P1000') || errorMessage.includes('Authentication failed')) {
      details = 'Database authentication failed. Please check your DATABASE_URL credentials.';
    } else if (errorMessage.includes('P1003') || errorMessage.includes('database') && errorMessage.includes('does not exist')) {
      details = 'Database does not exist. Please create the database or check the database name in DATABASE_URL.';
    } else if (!process.env.DATABASE_URL) {
      details = 'DATABASE_URL environment variable is not set. Please add it to your .env.local file.';
    } else {
      details = `Connection error: ${errorMessage}`;
    }
    
    return {
      success: false,
      error: errorMessage,
      details,
    };
  }
}









