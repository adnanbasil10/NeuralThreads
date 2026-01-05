import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET: Get all portfolio items from all designers (public endpoint for customers)
export async function GET(request: NextRequest) {
  try {
    console.log('📦 Fetching all portfolio items from designers...');
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const designerId = searchParams.get('designerId');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (designerId) {
      where.designerId = designerId;
    }

    // Get all portfolio items with designer information
    console.log('🔍 Querying portfolio items with filters:', where);
    
    // First, let's check if there are any portfolio items at all
    const totalCount = await prisma.portfolioItem.count();
    console.log(`📊 Total portfolio items in database: ${totalCount}`);
    
    const portfolioItems = await prisma.portfolioItem.findMany({
      where,
      include: {
        designer: {
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
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`📊 Found ${portfolioItems.length} portfolio items from database (with relations)`);
    
    // If we have items in DB but query returned 0, there might be a relation issue
    if (totalCount > 0 && portfolioItems.length === 0) {
      console.warn('⚠️ WARNING: Database has items but query returned 0. Checking relations...');
      // Try a simpler query to see if items exist
      const simpleItems = await prisma.portfolioItem.findMany({
        take: 5,
        select: {
          id: true,
          designerId: true,
          imageUrl: true,
          description: true,
        },
      });
      console.log('📋 Sample items (simple query):', simpleItems);
      
      // Check if designers exist
      if (simpleItems.length > 0) {
        const designerIds = [...new Set(simpleItems.map(item => item.designerId))];
        const designers = await prisma.designer.findMany({
          where: { id: { in: designerIds } },
          select: { id: true, userId: true },
        });
        console.log(`📋 Found ${designers.length} designers for ${designerIds.length} designer IDs`);
      }
    }

    // Filter by price range (client-side for better flexibility)
    let priceFilteredItems = portfolioItems;
    if (minPrice || maxPrice) {
      priceFilteredItems = portfolioItems.filter((item) => {
        const itemMin = item.budgetMin || 0;
        const itemMax = item.budgetMax || Infinity;
        const filterMin = minPrice ? parseFloat(String(minPrice)) : 0;
        const filterMax = maxPrice ? parseFloat(String(maxPrice)) : Infinity;

        // Item overlaps with filter range if:
        // - Item min is within filter range, OR
        // - Item max is within filter range, OR
        // - Item completely contains filter range
        return (
          (itemMin >= filterMin && itemMin <= filterMax) ||
          (itemMax >= filterMin && itemMax <= filterMax) ||
          (itemMin <= filterMin && itemMax >= filterMax)
        );
      });
    }

    // Filter by search term if provided (client-side filtering for description)
    let filteredItems = priceFilteredItems;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = priceFilteredItems.filter(
        (item) =>
          item.description?.toLowerCase().includes(searchLower) ||
          item.designer.user.name.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower)
      );
    }

    console.log(`✅ Found ${filteredItems.length} portfolio items (after filters)`);
    
    // Log first item structure for debugging
    if (filteredItems.length > 0) {
      const firstItem = filteredItems[0];
      console.log('📋 First item structure:', {
        id: firstItem.id,
        imageUrl: firstItem.imageUrl ? 'Yes' : 'No',
        description: firstItem.description?.substring(0, 50),
        designerName: firstItem.designer?.user?.name,
        designerId: firstItem.designer?.id,
        category: firstItem.category,
        budgetMin: firstItem.budgetMin,
        budgetMax: firstItem.budgetMax,
      });
    } else {
      console.log('⚠️ No items after filtering. Total in DB:', portfolioItems.length);
      if (portfolioItems.length > 0) {
        console.log('📋 Sample raw item:', {
          id: portfolioItems[0].id,
          imageUrl: portfolioItems[0].imageUrl ? 'Yes' : 'No',
          description: portfolioItems[0].description?.substring(0, 50),
          designerName: portfolioItems[0].designer?.user?.name,
        });
      }
    }
    
    // Serialize dates to strings for proper JSON response
    const serializedItems = filteredItems.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      success: true,
      data: serializedItems,
      count: serializedItems.length,
      totalInDb: portfolioItems.length,
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch designs',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      },
      { status: 500 }
    );
  }
}

