import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { Gender, Location, BodyShape, Language } from '@prisma/client';
import { sanitizeArray, sanitizeHtml, sanitizeString } from '@/lib/security/sanitizer';
import {
  sanitizeAndValidateEmail,
  isValidPhone,
  validateBudgetRange,
  validateEnumValue,
  validateName,
} from '@/lib/security/validation';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { apiCache } from '@/lib/cache/api-cache';

async function guardRateLimit(request: NextRequest, key: string) {
  try {
    await enforceRateLimit(request, apiLimiter, key);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please slow down.' },
        {
          status: error.statusCode,
          headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
        }
      );
    }
    throw error;
  }
  return null;
}

export async function PUT(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const rateLimitResponse = await guardRateLimit(request, user.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const userUpdateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const sanitizedName = sanitizeString(body.name);
      if (!validateName(sanitizedName)) {
        return NextResponse.json(
          { success: false, message: 'Name must be at least 2 characters' },
          { status: 400 }
        );
      }
      userUpdateData.name = sanitizedName;
    }

    if (body.age !== undefined) {
      const ageValue = Number(body.age);
      if (!Number.isFinite(ageValue) || ageValue < 13 || ageValue > 120) {
        return NextResponse.json(
          { success: false, message: 'Please provide a valid age' },
          { status: 400 }
        );
      }
      userUpdateData.age = ageValue;
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: userUpdateData,
    });

    // If user name is updated, invalidate designer caches (name appears in designer listings)
    if (userUpdateData.name && user.role === 'DESIGNER') {
      const designer = await prisma.designer.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (designer) {
        apiCache.invalidatePattern('/api/designers');
        apiCache.delete(`/api/designers/${designer.id}`);
      }
    }

    if (user.role === 'CUSTOMER') {
      const customerUpdate: Record<string, unknown> = {};
      if (body.gender && validateEnumValue(Gender, body.gender, 'gender')) {
        customerUpdate.gender = body.gender;
      }
      if (body.location && validateEnumValue(Location, body.location, 'location')) {
        customerUpdate.location = body.location;
      }
      if (Array.isArray(body.stylePreferences)) {
        customerUpdate.stylePreferences = sanitizeArray(body.stylePreferences, sanitizeString).filter(
          Boolean
        );
      }
      if (body.bodyShape && validateEnumValue(BodyShape, body.bodyShape, 'bodyShape')) {
        customerUpdate.bodyShape = body.bodyShape;
      }
      if (body.languagePreference && validateEnumValue(Language, body.languagePreference, 'lang')) {
        customerUpdate.languagePreference = body.languagePreference;
      }

      const budgetValidation = validateBudgetRange(body.budgetMin, body.budgetMax);
      if (!budgetValidation.isValid && (body.budgetMin !== undefined || body.budgetMax !== undefined)) {
        return NextResponse.json(
          { success: false, message: budgetValidation.errors[0] },
          { status: 400 }
        );
      }

      if (body.budgetMin !== undefined) customerUpdate.budgetMin = Number(body.budgetMin);
      if (body.budgetMax !== undefined) customerUpdate.budgetMax = Number(body.budgetMax);

      if (Object.keys(customerUpdate).length > 0) {
        await prisma.customer.update({
          where: { userId: user.userId },
          data: customerUpdate,
        });
      }
    }

    if (user.role === 'DESIGNER') {
      const designerUpdate: Record<string, unknown> = {};
      if (body.location) designerUpdate.location = sanitizeString(body.location);
      if (body.yearsExperience !== undefined) designerUpdate.yearsExperience = Number(body.yearsExperience);
      if (Array.isArray(body.designNiches)) designerUpdate.designNiches = body.designNiches;
      if (body.bio !== undefined) designerUpdate.bio = sanitizeHtml(body.bio);
      if (Array.isArray(body.languages)) {
        designerUpdate.languages = body.languages.filter((lang: Language) =>
          validateEnumValue(Language, lang, 'language')
        );
      }
      if (body.profilePhoto) designerUpdate.profilePhoto = sanitizeString(body.profilePhoto);
      if (body.contactPhone) {
        if (!isValidPhone(body.contactPhone)) {
          return NextResponse.json(
            { success: false, message: 'Invalid contact phone' },
            { status: 400 }
          );
        }
        designerUpdate.contactPhone = body.contactPhone;
      }
      if (body.contactEmail) {
        try {
          designerUpdate.contactEmail = sanitizeAndValidateEmail(body.contactEmail);
        } catch {
          return NextResponse.json(
            { success: false, message: 'Invalid contact email' },
            { status: 400 }
          );
        }
      }

      if (Object.keys(designerUpdate).length > 0) {
        const updatedDesigner = await prisma.designer.update({
          where: { userId: user.userId },
          data: designerUpdate,
        });
        
        // Invalidate all designer-related caches to reflect profile changes
        apiCache.invalidatePattern('/api/designers');
        // Also invalidate the specific designer's profile cache
        apiCache.delete(`/api/designers/${updatedDesigner.id}`);
      }
    }

    if (user.role === 'TAILOR') {
      const tailorUpdate: Record<string, unknown> = {};
      if (body.location) tailorUpdate.location = sanitizeString(body.location);
      if (body.yearsExperience !== undefined) tailorUpdate.yearsExperience = Number(body.yearsExperience);
      if (Array.isArray(body.skills)) {
        tailorUpdate.skills = sanitizeArray(body.skills, sanitizeString).filter(Boolean);
      }
      if (body.contactPhone) {
        if (!isValidPhone(body.contactPhone)) {
          return NextResponse.json(
            { success: false, message: 'Invalid contact phone' },
            { status: 400 }
          );
        }
        tailorUpdate.contactPhone = body.contactPhone;
      }
      if (body.contactEmail) {
        try {
          tailorUpdate.contactEmail = sanitizeAndValidateEmail(body.contactEmail);
        } catch {
          return NextResponse.json(
            { success: false, message: 'Invalid contact email' },
            { status: 400 }
          );
        }
      }

      if (Object.keys(tailorUpdate).length > 0) {
        await prisma.tailor.update({
          where: { userId: user.userId },
          data: tailorUpdate,
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        customer: true,
        designer: true,
        tailor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const rateLimitResponse = await guardRateLimit(request, user.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        customer: true,
        designer: true,
        tailor: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { password, emailVerifyToken, ...safeUser } = dbUser;

    return NextResponse.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
