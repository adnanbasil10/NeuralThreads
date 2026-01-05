import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { notifyNewReview } from '@/lib/notifications/createNotification';
import { apiCache } from '@/lib/cache/api-cache';

// GET - Fetch reviews for a designer or tailor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designerId = searchParams.get('designerId');
    const tailorId = searchParams.get('tailorId');

    if (!designerId && !tailorId) {
      return NextResponse.json(
        { success: false, error: 'Either designerId or tailorId is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (designerId) where.designerId = designerId;
    if (tailorId) where.tailorId = tailorId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
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

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review/rating
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { designerId, tailorId, rating, comment } = body;

    // Validate input
    if (!designerId && !tailorId) {
      return NextResponse.json(
        { success: false, error: 'Either designerId or tailorId is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: payload.userId as string },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: designerId
        ? { customerId_designerId: { customerId: customer.id, designerId } }
        : { customerId_tailorId: { customerId: customer.id, tailorId: tailorId! } },
    });

    // Get customer user info for notifications
    const customerUser = await prisma.user.findUnique({
      where: { id: customer.userId },
      select: { name: true },
    });

    // Use transaction to create/update review and update rating
    const result = await prisma.$transaction(async (tx) => {
      let review;
      if (existingReview) {
        // Update existing review
        review = await tx.review.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment: comment || null,
          },
        });
      } else {
        // Create new review
        review = await tx.review.create({
          data: {
            customerId: customer.id,
            designerId: designerId || null,
            tailorId: tailorId || null,
            rating,
            comment: comment || null,
          },
        });
      }

      // Update rating and review count
      if (designerId) {
        const reviews = await tx.review.findMany({
          where: { designerId },
        });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await tx.designer.update({
          where: { id: designerId },
          data: {
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            reviewCount: reviews.length,
          },
        });
      } else if (tailorId) {
        const reviews = await tx.review.findMany({
          where: { tailorId },
        });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await tx.tailor.update({
          where: { id: tailorId },
          data: {
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            reviewCount: reviews.length,
          },
        });
      }

      return review;
    });

    // Invalidate designers/tailors cache to reflect updated ratings
    if (designerId) {
      apiCache.invalidatePattern('/api/designers');
    } else if (tailorId) {
      apiCache.invalidatePattern('/api/tailors');
    }

    // Create notification for new reviews (after transaction)
    if (!existingReview && customerUser) {
      try {
        if (designerId) {
          const designer = await prisma.designer.findUnique({
            where: { id: designerId },
            select: { userId: true },
          });
          if (designer) {
            await notifyNewReview(
              designer.userId,
              customerUser.name,
              result.rating,
              result.id
            );
          }
        } else if (tailorId) {
          const tailor = await prisma.tailor.findUnique({
            where: { id: tailorId },
            select: { userId: true },
          });
          if (tailor) {
            await notifyNewReview(
              tailor.userId,
              customerUser.name,
              result.rating,
              result.id
            );
          }
        }
      } catch (error) {
        console.error('Error creating review notification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingReview ? 'Review updated successfully' : 'Review submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a review. You can update it instead.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}



