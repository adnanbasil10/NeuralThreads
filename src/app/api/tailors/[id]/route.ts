import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tailor = await prisma.tailor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        sampleWorks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!tailor) {
      return NextResponse.json(
        { success: false, error: 'Tailor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tailor,
    });
  } catch (error) {
    console.error('Error fetching tailor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tailor' },
      { status: 500 }
    );
  }
}










