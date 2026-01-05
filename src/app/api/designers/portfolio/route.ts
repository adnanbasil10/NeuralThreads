import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { apiCache } from '@/lib/cache/api-cache';

// GET - Fetch portfolio items for current designer
export async function GET(request: NextRequest) {
  try {
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

    // Get portfolio items
    const portfolioItems = await prisma.portfolioItem.findMany({
      where: { designerId: designer.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: portfolioItems,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

// POST - Add new portfolio item
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { imageUrl, description, budgetMin, budgetMax, category } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { success: false, message: 'Description is required' },
        { status: 400 }
      );
    }

    // Create portfolio item
    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        designerId: designer.id,
        imageUrl,
        description,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        category: category || 'CUSTOM',
      },
    });

    // Invalidate designers cache to reflect portfolio changes
    apiCache.invalidatePattern('/api/designers');

    return NextResponse.json({
      success: true,
      message: 'Portfolio item added successfully',
      data: portfolioItem,
    });
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add portfolio item' },
      { status: 500 }
    );
  }
}




