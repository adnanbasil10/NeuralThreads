import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { notifyProfileViewMilestone } from '@/lib/notifications/createNotification';
import { apiCache, generateCacheKey } from '@/lib/cache/api-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, check if we should increment views (before cache check)
    let shouldIncrementViews = false;
    let updatedViewCount: number | null = null;
    
    try {
      const currentUser = await getCurrentUser();
      const designerForCheck = await prisma.designer.findUnique({
        where: { id },
        select: { userId: true, profileViews: true },
      });

      if (designerForCheck) {
        // Only increment if:
        // 1. User is not authenticated (public view), OR
        // 2. User is authenticated but is NOT the designer themselves (customer viewing designer)
        if (!currentUser || currentUser.userId !== designerForCheck.userId) {
          shouldIncrementViews = true;
          
          const updatedDesigner = await prisma.designer.update({
            where: { id },
            data: {
              profileViews: {
                increment: 1,
              },
            },
            select: { profileViews: true, userId: true },
          });
          
          updatedViewCount = updatedDesigner.profileViews;
          
          // Check for milestone and create notification
          if (updatedDesigner.profileViews > 0) {
            await notifyProfileViewMilestone(
              updatedDesigner.userId,
              updatedDesigner.profileViews
            );
          }
          
          // Invalidate cache after incrementing views
          const cacheKey = generateCacheKey(`/api/designers/${id}`);
          apiCache.delete(cacheKey);
        }
      }
    } catch (error) {
      // Silently fail if view tracking fails - don't break the API
      // This handles cases where token is invalid or missing
      console.error('Error incrementing profile views:', error);
    }

    // Check cache (after potential view increment and cache invalidation)
    const cacheKey = generateCacheKey(`/api/designers/${id}`);
    const cached = apiCache.get<any>(cacheKey);
    if (cached && !shouldIncrementViews) {
      // Only use cache if we didn't just increment views
      return NextResponse.json(cached);
    }

    const designer = await prisma.designer.findUnique({
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
        portfolioItems: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!designer) {
      return NextResponse.json(
        { success: false, error: 'Designer not found' },
        { status: 404 }
      );
    }
    
    // Update profileViews in response if we just incremented it
    if (updatedViewCount !== null) {
      designer.profileViews = updatedViewCount;
    }

    // Get similar designers (same niches, different designer)
    const similarDesigners = await prisma.designer.findMany({
      where: {
        id: { not: id },
        designNiches: {
          hasSome: designer.designNiches,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 4,
      orderBy: {
        rating: 'desc',
      },
    });

    const response = {
      success: true,
      data: {
        ...designer,
        similarDesigners,
      },
    };

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, response, 2 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching designer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designer' },
      { status: 500 }
    );
  }
}




