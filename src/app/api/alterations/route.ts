import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { createNotification } from '@/lib/notifications/createNotification';
import { validateCsrfToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    try {
      validateCsrfToken(request);
    } catch (csrfError) {
      console.error('CSRF validation failed:', csrfError);
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in and try again.' },
        { status: 401 }
      );
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found. Please complete your profile setup.' },
        { status: 404 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { tailorId, description, imageUrl } = body;

    // Log incoming data for debugging
    console.log('Received alteration request data:', {
      tailorId: typeof tailorId,
      description: typeof description,
      descriptionLength: typeof description === 'string' ? description.length : 'N/A',
      hasImageUrl: !!imageUrl,
    });

    // Validate required fields
    if (!tailorId || typeof tailorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tailor ID is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      return NextResponse.json(
        { success: false, error: 'Description cannot be empty' },
        { status: 400 }
      );
    }

    // Validate description length (Prisma Text fields can be very long, but let's set a reasonable limit)
    if (trimmedDescription.length > 10000) {
      return NextResponse.json(
        { success: false, error: 'Description is too long (maximum 10,000 characters)' },
        { status: 400 }
      );
    }

    // Verify tailor exists
    const tailor = await prisma.tailor.findUnique({
      where: { id: tailorId },
    });

    if (!tailor) {
      return NextResponse.json(
        { success: false, error: 'Tailor not found' },
        { status: 404 }
      );
    }

    // Create alteration request
    let alterationRequest;
    try {
      console.log('Creating alteration request:', {
        customerId: customer.id,
        tailorId: tailor.id,
        descriptionLength: trimmedDescription.length,
        hasImageUrl: !!imageUrl,
      });

      // Prepare data with explicit types
      const alterationData = {
        customerId: customer.id,
        tailorId: tailor.id,
        description: trimmedDescription,
        imageUrl: imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0 ? imageUrl : null,
        status: 'PENDING' as const, // Explicitly type as AlterationStatus enum value
      };

      console.log('Alteration data to create:', {
        ...alterationData,
        description: `${alterationData.description.substring(0, 50)}... (${alterationData.description.length} chars)`,
      });

      alterationRequest = await prisma.alterationRequest.create({
        data: alterationData,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          tailor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      console.log('Alteration request created successfully:', alterationRequest.id);
    } catch (dbError: unknown) {
      // Log the full error for debugging
      const error = dbError as { code?: string; message?: string; meta?: unknown; cause?: unknown; name?: string; stack?: string };
      console.error('Database error creating alteration request:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
        cause: error.cause,
        name: error.name,
        stack: error.stack?.substring(0, 500), // First 500 chars of stack
      });

      // Log the actual data that failed
      console.error('Failed data:', {
        customerId: customer.id,
        tailorId,
        descriptionLength: trimmedDescription.length,
        hasImageUrl: !!imageUrl,
      });
      
      // Provide more specific error messages
      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'A similar request already exists' },
          { status: 409 }
        );
      }

      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Invalid customer or tailor reference' },
          { status: 400 }
        );
      }

      // Clean ANSI escape codes and Turbopack module paths from error message
      const dbErrorMessage = dbError && typeof dbError === 'object' && 'message' in dbError 
        ? String(dbError.message) 
        : 'Unknown database error';
      let cleanErrorMessage = dbErrorMessage;
      const originalMessage = cleanErrorMessage;
      
      // Remove ANSI escape codes (both formats)
      cleanErrorMessage = cleanErrorMessage
        .replace(/\x1b\[[0-9;]*m/g, '') // Remove standard ANSI codes
        .replace(/\[31m|\[1m|\[39m|\[22m|\[90m|\[34m|\[36m|\[32m|\[0m/g, '') // Remove specific ANSI codes
        .replace(/_TURBOPACK_imported_module_\$[^\s]+/g, '') // Remove Turbopack module paths
        .replace(/\$5b|\$5d|\$2f/g, (match) => {
          // Decode URL-encoded characters in module paths
          const map: Record<string, string> = { '$5b': '[', '$5d': ']', '$2f': '/' };
          return map[match] || match;
        })
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Try to extract meaningful error message
      // Look for common Prisma error patterns
      let meaningfulError = cleanErrorMessage;
      
      // Pattern 1: "Invalid value for argument" or "Invalid" followed by field info
      const invalidMatch = cleanErrorMessage.match(/Invalid[^:]*:\s*(.+?)(?:\s+at\s|$)/i);
      if (invalidMatch && invalidMatch[1]) {
        meaningfulError = invalidMatch[1].trim();
      }
      
      // Pattern 2: "Unknown argument" or "Argument" errors
      const argMatch = cleanErrorMessage.match(/(?:Unknown|Invalid)\s+argument[^:]*:\s*(.+?)(?:\s+at\s|$)/i);
      if (argMatch && argMatch[1]) {
        meaningfulError = `Invalid field: ${argMatch[1].trim()}`;
      }
      
      // Pattern 3: Foreign key constraint errors
      if (cleanErrorMessage.includes('Foreign key constraint') || cleanErrorMessage.includes('relation')) {
        meaningfulError = 'Invalid customer or tailor reference. Please refresh and try again.';
      }
      
      // Pattern 4: Required field errors
      if (cleanErrorMessage.includes('required') || cleanErrorMessage.includes('Missing')) {
        meaningfulError = 'Required field is missing. Please check your input.';
      }
      
      // If we couldn't extract a meaningful message, use a generic one
      if (meaningfulError === cleanErrorMessage && (cleanErrorMessage.length > 200 || cleanErrorMessage.includes('query_engine') || cleanErrorMessage.includes('prisma') || cleanErrorMessage.includes('TURBOPACK'))) {
        meaningfulError = 'Database validation error. Please check your input and try again.';
      }
      
      // Log the original error for debugging
      console.error('Original Prisma error:', originalMessage);
      console.error('Cleaned error:', cleanErrorMessage);
      console.error('Meaningful error:', meaningfulError);
      
      // Return detailed error in development, user-friendly in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Database error: ${meaningfulError}`
        : meaningfulError.length < 150 ? meaningfulError : 'Failed to create alteration request. Please try again.';
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            code: dbError && typeof dbError === 'object' && 'code' in dbError ? dbError.code : undefined,
            message: cleanErrorMessage,
            meta: dbError && typeof dbError === 'object' && 'meta' in dbError ? dbError.meta : undefined,
          } : undefined
        },
        { status: 500 }
      );
    }

    // Create notification for the tailor
    try {
      if (alterationRequest.tailor?.user?.id) {
        await createNotification({
          userId: alterationRequest.tailor.user.id,
          type: 'ORDER_UPDATE',
          title: `New alteration request from ${alterationRequest.customer.user.name}`,
          message: description.length > 100 ? description.substring(0, 100) + '...' : description,
          link: `/tailor/requests?id=${alterationRequest.id}`,
        });
      }
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.error('Error creating notification for alteration request:', notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Alteration request submitted successfully',
        data: alterationRequest,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Unexpected error creating alteration request:', error);
    
    // Provide more helpful error messages
    const errorMessage = (error as { message?: string })?.message || 'Failed to submit alteration request';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error && typeof error === 'object' && 'stack' in error ? String(error.stack) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause based on user role
    const where: Record<string, unknown> = {};

    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });
      if (customer) {
        where.customerId = customer.id;
      }
    } else if (user.role === 'TAILOR') {
      const tailor = await prisma.tailor.findUnique({
        where: { userId: user.userId },
      });
      if (tailor) {
        where.tailorId = tailor.id;
      }
    }

    if (status) {
      where.status = status;
    }

    const alterations = await prisma.alterationRequest.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        tailor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: alterations,
    });
  } catch (error) {
    console.error('Error fetching alteration requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alteration requests' },
      { status: 500 }
    );
  }
}




