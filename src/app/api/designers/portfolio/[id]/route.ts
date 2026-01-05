import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { apiCache } from '@/lib/cache/api-cache';

// GET - Fetch single portfolio item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: { id },
      include: {
        designer: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!portfolioItem) {
      return NextResponse.json(
        { success: false, message: 'Portfolio item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: portfolioItem,
    });
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch portfolio item' },
      { status: 500 }
    );
  }
}

// PUT - Update portfolio item
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

    // Get designer profile
    const designer = await prisma.designer.findUnique({
      where: { userId: payload.userId as string },
    });

    if (!designer) {
      return NextResponse.json(
        { success: false, message: 'Designer profile not found' },
        { status: 404 }
      );
    }

    // Check if portfolio item belongs to this designer
    const existingItem = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: 'Portfolio item not found' },
        { status: 404 }
      );
    }

    if (existingItem.designerId !== designer.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this item' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageUrl, description, budgetMin, budgetMax, category } = body;

    // Update portfolio item
    const updatedItem = await prisma.portfolioItem.update({
      where: { id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(description && { description }),
        ...(budgetMin !== undefined && { budgetMin: budgetMin ? parseFloat(budgetMin) : null }),
        ...(budgetMax !== undefined && { budgetMax: budgetMax ? parseFloat(budgetMax) : null }),
        ...(category && { category }),
      },
    });

    // Invalidate designers cache to reflect portfolio changes
    apiCache.invalidatePattern('/api/designers');

    return NextResponse.json({
      success: true,
      message: 'Portfolio item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update portfolio item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete portfolio item
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

    // Get designer profile
    const designer = await prisma.designer.findUnique({
      where: { userId: payload.userId as string },
    });

    if (!designer) {
      return NextResponse.json(
        { success: false, message: 'Designer profile not found' },
        { status: 404 }
      );
    }

    // Check if portfolio item belongs to this designer
    const existingItem = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: 'Portfolio item not found' },
        { status: 404 }
      );
    }

    if (existingItem.designerId !== designer.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this item' },
        { status: 403 }
      );
    }

    // Delete portfolio item
    await prisma.portfolioItem.delete({
      where: { id },
    });

    // Invalidate designers cache to reflect portfolio changes
    apiCache.invalidatePattern('/api/designers');

    return NextResponse.json({
      success: true,
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete portfolio item' },
      { status: 500 }
    );
  }
}




