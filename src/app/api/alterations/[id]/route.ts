import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/security/csrf';

// GET - Fetch single alteration request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const alteration = await prisma.alterationRequest.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        tailor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!alteration) {
      return NextResponse.json(
        { success: false, message: 'Alteration request not found' },
        { status: 404 }
      );
    }

    // Transform response to include customer name and phone
    const response = {
      ...alteration,
      customerName: alteration.customer.user.name,
      customerPhone: alteration.customer.user.email, // Use email as placeholder; ideally have phone field
      customerLocation: alteration.customer.location,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching alteration:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch alteration request' },
      { status: 500 }
    );
  }
}

// PUT - Update alteration request (status, notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CSRF token
    try {
      // Debug logging - check all cookies
      const headerToken = request.headers.get('x-csrf-token');
      const cookieToken = request.cookies.get('nt.csrf')?.value;
      const allCookies = request.cookies.getAll();
      const cookieMap: Record<string, string> = {};
      allCookies.forEach(c => {
        cookieMap[c.name] = c.value.substring(0, 20) + '...'; // Show first 20 chars
      });
      
      console.log('🔐 CSRF Debug - Request received:', {
        method: request.method,
        url: request.url,
        hasHeaderToken: !!headerToken,
        headerTokenLength: headerToken?.length || 0,
        headerTokenPreview: headerToken ? headerToken.substring(0, 20) + '...' : 'none',
        hasCookieToken: !!cookieToken,
        cookieTokenLength: cookieToken?.length || 0,
        cookieTokenPreview: cookieToken ? cookieToken.substring(0, 20) + '...' : 'none',
        allCookieNames: allCookies.map(c => c.name),
        cookieMap,
      });
      
      // If cookie is missing, provide helpful error
      if (!cookieToken) {
        console.error('❌ CSRF cookie missing! Available cookies:', Object.keys(cookieMap));
        return NextResponse.json(
          { 
            success: false, 
            message: 'CSRF cookie not found. Please refresh the page to get a new security token.',
            debug: process.env.NODE_ENV === 'development' ? {
              availableCookies: Object.keys(cookieMap),
              hasHeader: !!headerToken,
            } : undefined,
          },
          { status: 403 }
        );
      }
      
      // If header is missing, provide helpful error
      if (!headerToken) {
        console.error('❌ CSRF header token missing!');
        return NextResponse.json(
          { 
            success: false, 
            message: 'CSRF token not found in request. Please refresh the page and try again.',
          },
          { status: 403 }
        );
      }
      
      validateCsrfToken(request);
      console.log('✅ CSRF validation passed');
    } catch (csrfError) {
      console.error('❌ CSRF validation failed:', csrfError);
      const headerToken = request.headers.get('x-csrf-token');
      const cookieToken = request.cookies.get('nt.csrf')?.value;
      console.error('CSRF Debug on error:', {
        hasHeaderToken: !!headerToken,
        hasCookieToken: !!cookieToken,
        error: csrfError instanceof Error ? csrfError.message : String(csrfError),
      });
      return NextResponse.json(
        { 
          success: false, 
          message: csrfError instanceof Error && csrfError.message.includes('Missing') 
            ? csrfError.message + ' Please refresh the page and try again.'
            : 'Invalid CSRF token. Please refresh the page and try again.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload) || !('role' in payload)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Only tailors can update alteration requests
    if (payload.role !== 'TAILOR') {
      return NextResponse.json(
        { success: false, message: 'Only tailors can update alteration requests' },
        { status: 403 }
      );
    }

    // Get tailor profile
    const tailor = await prisma.tailor.findUnique({
      where: { userId: payload.userId as string },
    });

    if (!tailor) {
      return NextResponse.json(
        { success: false, message: 'Tailor profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Validate notes if provided (optional field)
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Notes must be a string' },
        { status: 400 }
      );
    }

    // Get alteration with customer info before update
    const existingAlteration = await prisma.alterationRequest.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        tailor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!existingAlteration) {
      return NextResponse.json(
        { success: false, message: 'Alteration request not found' },
        { status: 404 }
      );
    }

    // Check if alteration belongs to this tailor
    if (existingAlteration.tailorId !== tailor.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this request' },
        { status: 403 }
      );
    }

    // Update alteration request
    const updatedAlteration = await prisma.alterationRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && notes !== null && { notes: notes.trim() || null }),
      },
      include: {
        customer: {
          include: {
            user: {
              select: { name: true, id: true },
            },
          },
        },
        tailor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Send notification to customer when status changes
    if (status && existingAlteration.customer?.user?.id) {
      try {
        const { createNotification } = await import('@/lib/notifications/createNotification');
        
        let notificationTitle = '';
        let notificationMessage = '';
        
        switch (status) {
          case 'IN_PROGRESS':
            notificationTitle = 'Alteration Request Accepted';
            notificationMessage = `${existingAlteration.tailor?.user?.name || 'The tailor'} has accepted your alteration request and started working on it.`;
            break;
          case 'COMPLETED':
            notificationTitle = 'Alteration Request Completed';
            notificationMessage = `Your alteration request has been completed by ${existingAlteration.tailor?.user?.name || 'the tailor'}.`;
            break;
          case 'REJECTED':
            notificationTitle = 'Alteration Request Rejected';
            notificationMessage = `Your alteration request has been rejected by ${existingAlteration.tailor?.user?.name || 'the tailor'}.`;
            break;
        }
        
        if (notificationTitle && notificationMessage) {
          await createNotification({
            userId: existingAlteration.customer.user.id,
            type: 'ORDER_UPDATE',
            title: notificationTitle,
            message: notificationMessage,
            link: `/customer/alterations`,
          });
        }
      } catch (error) {
        // Don't fail the request if notification creation fails
        console.error('Error creating notification for customer:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alteration request updated successfully',
      data: updatedAlteration,
    });
  } catch (error) {
    console.error('Error updating alteration:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update alteration request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete/Cancel alteration request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const existingAlteration = await prisma.alterationRequest.findUnique({
      where: { id },
    });

    if (!existingAlteration) {
      return NextResponse.json(
        { success: false, message: 'Alteration request not found' },
        { status: 404 }
      );
    }

    // Update status to REJECTED instead of deleting
    await prisma.alterationRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Alteration request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling alteration:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel alteration request' },
      { status: 500 }
    );
  }
}




