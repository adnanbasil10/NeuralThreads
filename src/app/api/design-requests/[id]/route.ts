import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { sanitizeString } from '@/lib/security/sanitizer';
import { cookies } from 'next/headers';

// GET: Get single design request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const designRequest = await prisma.designRequest.findUnique({
      where: { id },
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

    if (!designRequest) {
      return NextResponse.json(
        { success: false, message: 'Design request not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    if (user.role === 'DESIGNER') {
      const designer = await prisma.designer.findUnique({
        where: { userId: user.userId },
      });
      if (designer?.id !== designRequest.designerId) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    } else if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });
      if (customer?.id !== designRequest.customerId) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: designRequest,
    });
  } catch (error) {
    console.error('Get design request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch design request' },
      { status: 500 }
    );
  }
}

// PUT: Update design request (Designer - accept/reject/set price)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateCsrfToken(request);

    const user = await getCurrentUser();
    if (!user || user.role !== 'DESIGNER') {
      return NextResponse.json(
        { success: false, message: 'Only designers can update design requests' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, quotedPrice, notes } = body;

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

    // Get design request
    const designRequest = await prisma.designRequest.findFirst({
      where: {
        id,
        designerId: designer.id,
      },
    });

    if (!designRequest) {
      return NextResponse.json(
        { success: false, message: 'Design request not found' },
        { status: 404 }
      );
    }

    // Update design request
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (quotedPrice !== undefined) {
      updateData.quotedPrice = quotedPrice;
    }
    if (notes !== undefined) {
      updateData.notes = notes ? sanitizeString(notes) : null;
    }

    const updated = await prisma.designRequest.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Design request updated successfully',
    });
  } catch (error) {
    console.error('Update design request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update design request' },
      { status: 500 }
    );
  }
}


