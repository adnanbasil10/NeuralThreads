import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { sanitizeString } from '@/lib/security/sanitizer';

// Ensure this route always runs on Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: Create a new design request (Customer)
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token with proper error handling
    try {
      validateCsrfToken(request);
    } catch (csrfError) {
      const csrfErrorMessage = csrfError instanceof Error ? csrfError.message : 'CSRF validation failed';
      return NextResponse.json(
        { success: false, message: 'Security validation failed. Please refresh the page and try again.', error: csrfErrorMessage },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, message: 'Only customers can create design requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { designerId, description, imageUrl, referenceImageUrl, chatId } = body;

    if (!designerId || !description) {
      return NextResponse.json(
        { success: false, message: 'Designer ID and description are required' },
        { status: 400 }
      );
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Verify designer exists
    const designer = await prisma.designer.findUnique({
      where: { id: designerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!designer) {
      return NextResponse.json(
        { success: false, message: 'Designer not found' },
        { status: 404 }
      );
    }

    // Create design request
    const designRequest = await prisma.designRequest.create({
      data: {
        customerId: customer.id,
        designerId: designerId,
        description: sanitizeString(description),
        imageUrl: imageUrl || null,
        referenceImageUrl: referenceImageUrl || null,
        chatId: chatId || null,
        status: 'PENDING',
      },
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
        designer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create notification for the designer
    try {
      if (designer.user?.id) {
        const { createNotification } = await import('@/lib/notifications/createNotification');
        await createNotification({
          userId: designer.user.id,
          type: 'DESIGN_ORDER' as any,
          title: `New design request from ${designRequest.customer.user.name}`,
          message: description.length > 100 ? description.substring(0, 100) + '...' : description,
          link: `/designer/requests?id=${designRequest.id}`,
        });
      }
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.error('Failed to create notification for design request:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: designRequest,
      message: 'Design request created successfully',
    });
  } catch (error) {
    console.error('Create design request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create design request';

    // Always return JSON, never HTML
    // Handle CSRF errors specifically (though they should be caught above)
    if (errorMessage.includes('CSRF') || errorMessage.includes('csrf')) {
      return NextResponse.json(
        { success: false, message: 'Security validation failed. Please refresh the page and try again.', error: errorMessage },
        { status: 403 }
      );
    }

    // Handle Prisma/database errors
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('P2002')) {
      return NextResponse.json(
        { success: false, message: 'A design request already exists for this designer.', error: errorMessage },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: errorMessage, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Get design requests (Designer or Customer)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = user.role;

    let designRequests;

    if (role === 'DESIGNER') {
      // Get designer profile
      const designer = await prisma.designer.findUnique({
        where: { userId: user.userId },
      });

      if (!designer) {
        return NextResponse.json(
          { success: false, message: 'Designer profile not found' },
          { status: 404 }
        );
      }

      // Get requests for this designer
      const where: any = { designerId: designer.id };
      if (status && status !== 'all') {
        where.status = status;
      }

      designRequests = await prisma.designRequest.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (role === 'CUSTOMER') {
      // Get customer profile
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, message: 'Customer profile not found' },
          { status: 404 }
        );
      }

      // Get requests for this customer
      const where: any = { customerId: customer.id };
      if (status && status !== 'all') {
        where.status = status;
      }

      designRequests = await prisma.designRequest.findMany({
        where,
        include: {
          designer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: designRequests,
    });
  } catch (error) {
    console.error('Get design requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design requests' },
      { status: 500 }
    );
  }
}


