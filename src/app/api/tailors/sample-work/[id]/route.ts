import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

// GET - Fetch single sample work
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sampleWork = await prisma.sampleWork.findUnique({
      where: { id },
      include: {
        tailor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!sampleWork) {
      return NextResponse.json(
        { success: false, message: 'Sample work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sampleWork,
    });
  } catch (error) {
    console.error('Error fetching sample work:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sample work' },
      { status: 500 }
    );
  }
}

// PUT - Update sample work
export async function PUT(
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

    // Check if sample work belongs to this tailor
    const existingWork = await prisma.sampleWork.findUnique({
      where: { id },
    });

    if (!existingWork) {
      return NextResponse.json(
        { success: false, message: 'Sample work not found' },
        { status: 404 }
      );
    }

    if (existingWork.tailorId !== tailor.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this sample work' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageUrl, description } = body;

    // Update sample work
    const updatedWork = await prisma.sampleWork.update({
      where: { id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sample work updated successfully',
      data: updatedWork,
    });
  } catch (error) {
    console.error('Error updating sample work:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update sample work' },
      { status: 500 }
    );
  }
}

// DELETE - Delete sample work
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

    // Check if sample work belongs to this tailor
    const existingWork = await prisma.sampleWork.findUnique({
      where: { id },
    });

    if (!existingWork) {
      return NextResponse.json(
        { success: false, message: 'Sample work not found' },
        { status: 404 }
      );
    }

    if (existingWork.tailorId !== tailor.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this sample work' },
        { status: 403 }
      );
    }

    // Delete sample work
    await prisma.sampleWork.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Sample work deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting sample work:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sample work' },
      { status: 500 }
    );
  }
}










