import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

// GET - Fetch sample work for current tailor or specific tailor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tailorId = searchParams.get('tailorId');

    // If tailorId is provided, fetch public sample work for that tailor
    if (tailorId) {
      const sampleWork = await prisma.sampleWork.findMany({
        where: { tailorId },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: sampleWork,
      });
    }

    // Otherwise, fetch sample work for authenticated tailor
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

    const sampleWork = await prisma.sampleWork.findMany({
      where: { tailorId: tailor.id },
      orderBy: { createdAt: 'desc' },
    });

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

// POST - Add new sample work
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
    const { imageUrl, description } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Create sample work
    const sampleWork = await prisma.sampleWork.create({
      data: {
        tailorId: tailor.id,
        imageUrl,
        description: description || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sample work added successfully',
      data: sampleWork,
    });
  } catch (error) {
    console.error('Error adding sample work:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add sample work' },
      { status: 500 }
    );
  }
}










