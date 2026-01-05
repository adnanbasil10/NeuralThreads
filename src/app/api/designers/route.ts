import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DesignNiche, Language } from '@prisma/client';
import { apiCache, generateCacheKey } from '@/lib/cache/api-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check cache first
    const cacheKey = generateCacheKey('/api/designers', Object.fromEntries(searchParams));
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const niches = searchParams.getAll('niche') as DesignNiche[];
    const location = searchParams.get('location') || '';
    const minExperience = parseInt(searchParams.get('minExperience') || '0');
    const maxExperience = parseInt(searchParams.get('maxExperience') || '50');
    const minBudget = parseInt(searchParams.get('minBudget') || '0');
    const maxBudget = parseInt(searchParams.get('maxBudget') || '1000000');
    const languages = searchParams.getAll('language') as Language[];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search by name
    if (search) {
      where.user = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    // Filter by niches
    if (niches.length > 0) {
      where.designNiches = {
        hasSome: niches,
      };
    }

    // Filter by location
    if (location) {
      where.location = location;
    }

    // Filter by experience
    if (minExperience > 0 || maxExperience < 50) {
      where.yearsExperience = {
        gte: minExperience,
        lte: maxExperience,
      };
    }

    // Filter by languages
    if (languages.length > 0) {
      where.languages = {
        hasSome: languages,
      };
    }

    // Get total count for pagination
    const total = await prisma.designer.count({ where });

    // Build orderBy
    const orderBy: Record<string, string> = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'experience') {
      orderBy.yearsExperience = sortOrder;
    } else if (sortBy === 'reviews') {
      orderBy.reviewCount = sortOrder;
    }

    // Fetch designers
    const designers = await prisma.designer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        portfolioItems: {
          take: 10, // Show more portfolio items to reflect recent changes
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter by budget (portfolio items budget) - only if budget filter is applied
    let filteredDesigners = designers;
    if (minBudget > 0 || maxBudget < 1000000) {
      filteredDesigners = designers.filter((designer) => {
        const hasItemInBudget = designer.portfolioItems.some(
          (item) =>
            (item.budgetMin === null || item.budgetMin >= minBudget) &&
            (item.budgetMax === null || item.budgetMax <= maxBudget)
        );
        return hasItemInBudget || designer.portfolioItems.length === 0;
      });
      
      // If budget filtering reduced results, we may need to fetch more
      // For now, we'll return what we have and let the client handle pagination
    }

    const response = {
      success: true,
      data: filteredDesigners,
      pagination: {
        page,
        limit,
        total: filteredDesigners.length < limit ? filteredDesigners.length : total,
        totalPages: Math.ceil(total / limit),
      },
    };
    
    // Cache the response for 2 minutes
    apiCache.set(cacheKey, response, 2 * 60 * 1000);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching designers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designers' },
      { status: 500 }
    );
  }
}
