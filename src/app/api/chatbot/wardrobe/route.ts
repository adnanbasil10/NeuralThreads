import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { v2 as cloudinary } from 'cloudinary';
import { validateCsrfToken } from '@/lib/security/csrf';
import { wardrobeLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { scanBufferForMalware } from '@/lib/security/malware';
import { sanitizeString } from '@/lib/security/sanitizer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Categories for wardrobe items
const WARDROBE_CATEGORIES = [
  'UPPERWEAR',
  'BOTTOMWEAR',
  'SHOES',
  'BAG',
  'JACKET',
  'ACCESSORIES',
  'DRESS',
  'OUTERWEAR',
] as const;

// Subcategories for DRESS type (from PortfolioCategory enum)
const DRESS_SUBCATEGORIES = [
  'BRIDAL',
  'CASUAL',
  'FORMAL',
  'ETHNIC',
  'WESTERN',
  'FUSION',
  'CUSTOM',
] as const;

type WardrobeCategory = typeof WARDROBE_CATEGORIES[number];
type DressSubcategory = typeof DRESS_SUBCATEGORIES[number];

// POST: Upload wardrobe item
export async function POST(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await enforceRateLimit(request, wardrobeLimiter, user.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many wardrobe uploads. Please slow down.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const formData = await request.formData();
    const imageUrlParam = formData.get('imageUrl') as string | null; // Only accept imageUrl from Browse Designs/Portfolio
    const category = formData.get('category') as WardrobeCategory | null;
    const subcategory = formData.get('subcategory') as string | null; // Dress subcategory: BRIDAL, CASUAL, FORMAL, etc.
    const color = formData.get('color') ? sanitizeString(String(formData.get('color'))) : null;
    const name = formData.get('name') ? sanitizeString(String(formData.get('name'))) : null;

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Only accept imageUrl (from Browse Designs or Designer Portfolio)
    if (!imageUrlParam) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required. Please save items from Browse Designs or Designer Portfolio.' },
        { status: 400 }
      );
    }

    // Validate URL format
    let imageUrl = '';
    try {
      new URL(imageUrlParam);
      imageUrl = imageUrlParam;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Determine category if not provided (basic heuristic based on name or description)
    let finalCategory: WardrobeCategory = category && WARDROBE_CATEGORIES.includes(category) ? category : 'UPPERWEAR';
    
    const searchText = (name || '').toLowerCase();
    
    if (!category) {
      if (searchText.includes('shirt') || searchText.includes('top') || searchText.includes('blouse') || searchText.includes('kurta') || searchText.includes('t-shirt')) {
        finalCategory = 'UPPERWEAR';
      } else if (searchText.includes('pant') || searchText.includes('jeans') || searchText.includes('skirt') || searchText.includes('shorts') || searchText.includes('trouser')) {
        finalCategory = 'BOTTOMWEAR';
      } else if (searchText.includes('shoe') || searchText.includes('sneaker') || searchText.includes('heel') || searchText.includes('sandal') || searchText.includes('boot')) {
        finalCategory = 'SHOES';
      } else if (searchText.includes('bag') || searchText.includes('purse') || searchText.includes('clutch') || searchText.includes('handbag')) {
        finalCategory = 'BAG';
      } else if (searchText.includes('jacket') || searchText.includes('blazer') || searchText.includes('coat') || searchText.includes('cardigan')) {
        finalCategory = 'JACKET';
      } else if (searchText.includes('dress') || searchText.includes('gown') || searchText.includes('saree') || searchText.includes('lehenga') || searchText.includes('suit')) {
        finalCategory = 'DRESS';
      } else if (searchText.includes('watch') || searchText.includes('jewelry') || searchText.includes('earring') || searchText.includes('necklace') || searchText.includes('bracelet')) {
        finalCategory = 'ACCESSORIES';
      }
    }

    // Validate and set subcategory only for DRESS category
    let finalSubcategory: DressSubcategory | null = null;
    if (finalCategory === 'DRESS' && subcategory) {
      // Validate that subcategory is a valid PortfolioCategory enum value
      if (DRESS_SUBCATEGORIES.includes(subcategory as DressSubcategory)) {
        finalSubcategory = subcategory as DressSubcategory;
      } else {
        console.warn(`Invalid subcategory "${subcategory}" for DRESS category. Valid values: ${DRESS_SUBCATEGORIES.join(', ')}`);
        // Don't fail, just log a warning and continue without subcategory
      }
    }

    // Create wardrobe item
    const wardrobeItem = await prisma.wardrobeItem.create({
      data: {
        customerId: customer.id,
        imageUrl,
        category: finalCategory,
        subcategory: finalSubcategory, // Only set if valid and category is DRESS
        color: color || null,
        name: name || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: wardrobeItem,
      message: `${finalCategory} item added to your wardrobe!`,
    });
  } catch (error) {
    console.error('Wardrobe upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload wardrobe item';
    if (error instanceof Error) {
      // Check for Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'This item is already in your wardrobe';
      } else if (error.message.includes('Invalid enum value')) {
        errorMessage = 'Invalid category or subcategory value';
      } else if (error.message.includes('Record to create not found')) {
        errorMessage = 'Customer profile not found. Please contact support.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// GET: Get user's wardrobe items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const rateLimitResponse = await (async () => {
      try {
        await enforceRateLimit(request, wardrobeLimiter, user.userId);
        return null;
      } catch (error) {
        if (error instanceof RateLimitError) {
          return NextResponse.json(
            { success: false, error: 'Too many wardrobe requests. Please slow down.' },
            {
              status: error.statusCode,
              headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
            }
          );
        }
        throw error;
      }
    })();

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as WardrobeCategory | null;

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Get wardrobe items (limit to 100 for performance)
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        customerId: customer.id,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by category
    const groupedItems = wardrobeItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof wardrobeItems>);

    return NextResponse.json({
      success: true,
      data: {
        items: wardrobeItems,
        grouped: groupedItems,
        total: wardrobeItems.length,
      },
    });
  } catch (error) {
    console.error('Get wardrobe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wardrobe items' },
      { status: 500 }
    );
  }
}

// DELETE: Remove wardrobe item
export async function DELETE(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await enforceRateLimit(request, wardrobeLimiter, user.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many delete requests. Please wait and try again.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const safeItemId = sanitizeString(itemId);

    // Verify ownership and delete
    const item = await prisma.wardrobeItem.findFirst({
      where: {
        id: safeItemId,
        customerId: customer.id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    await prisma.wardrobeItem.delete({
      where: { id: safeItemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from wardrobe',
    });
  } catch (error) {
    console.error('Delete wardrobe item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete wardrobe item' },
      { status: 500 }
    );
  }
}


