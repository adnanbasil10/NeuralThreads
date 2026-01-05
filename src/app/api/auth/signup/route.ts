import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
// Email verification disabled - accounts are immediately verified
import {
  UserRole,
  Gender,
  Location,
  BodyShape,
  Language,
  DesignNiche,
} from '@prisma/client';
import { sanitizeString, sanitizeArray, sanitizeHtml } from '@/lib/security/sanitizer';
import {
  sanitizeAndValidateEmail,
  validatePassword,
  validateName,
  validateEnumValue,
  validateBudgetRange,
  validateArrayMaxLength,
  isValidPhone,
} from '@/lib/security/validation';
import { validateCsrfToken } from '@/lib/security/csrf';
import { enforceRateLimit, signupLimiter, RateLimitError } from '@/lib/security/rate-limit';

interface SignupBody {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  age?: number;
  gender?: Gender;
  location?: Location;
  stylePreferences?: string[];
  bodyShape?: BodyShape;
  languagePreference?: Language;
  budgetMin?: number;
  budgetMax?: number;
  designerLocation?: string;
  yearsExperience?: number;
  designNiches?: DesignNiche[];
  bio?: string;
  languages?: Language[];
  contactPhone?: string;
  contactEmail?: string;
  profilePhoto?: string;
  tailorLocation?: string;
  latitude?: number;
  longitude?: number;
  skills?: string[];
}

const MAX_STYLE_PREFERENCES = 20;

const safeOptionalNumber = (value?: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

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

    // Rate limiting - wrapped in try-catch to prevent blocking
    try {
      await enforceRateLimit(request, signupLimiter);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many signup attempts. Please wait before retrying.' },
          {
            status: error.statusCode || 429,
            headers: error.retryAfter
              ? { 'Retry-After': error.retryAfter.toString() }
              : undefined,
          }
        );
      }
      // If rate limiter fails, log but don't block the request
      console.warn('Rate limit check failed (non-blocking):', error);
    }

    let body: SignupBody;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const passwordValue = typeof body.password === 'string' ? body.password : '';
    const passwordValidation = validatePassword(passwordValue);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    let email: string;
    try {
      email = sanitizeAndValidateEmail(body.email);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const name = sanitizeString(body.name ?? '');
    if (!validateName(name)) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!validateEnumValue(UserRole, body.role, 'role')) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be CUSTOMER, DESIGNER, or TAILOR' },
        { status: 400 }
      );
    }

    const stylePreferences = Array.from(
      new Set(
        sanitizeArray(body.stylePreferences || [], sanitizeString)
          .map((pref) => pref.trim())
          .filter(Boolean)
      )
    );

    if (stylePreferences.length > MAX_STYLE_PREFERENCES) {
      return NextResponse.json(
        { success: false, error: `Please limit style preferences to ${MAX_STYLE_PREFERENCES}` },
        { status: 400 }
      );
    }

    if (stylePreferences.length && !validateArrayMaxLength(stylePreferences, MAX_STYLE_PREFERENCES)) {
      return NextResponse.json(
        { success: false, error: 'One or more style preferences are invalid' },
        { status: 400 }
      );
    }

    const budgetValidation = validateBudgetRange(body.budgetMin, body.budgetMax);
    if (!budgetValidation.isValid) {
      return NextResponse.json(
        { success: false, error: budgetValidation.errors[0] },
        { status: 400 }
      );
    }

    const gender =
      body.gender && validateEnumValue(Gender, body.gender, 'gender') ? body.gender : undefined;

    const customerLocation =
      body.location && validateEnumValue(Location, body.location, 'location')
        ? body.location
        : undefined;

    const bodyShape =
      body.bodyShape && validateEnumValue(BodyShape, body.bodyShape, 'bodyShape')
        ? body.bodyShape
        : undefined;

    const languagePreference =
      body.languagePreference && validateEnumValue(Language, body.languagePreference, 'language')
        ? body.languagePreference
        : Language.ENGLISH;

    const languages =
      body.languages?.filter((lang) => validateEnumValue(Language, lang, 'language')) ||
      [Language.ENGLISH];

    let contactEmail = email;
    if (body.contactEmail) {
      try {
        contactEmail = sanitizeAndValidateEmail(body.contactEmail);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid contact email' },
          { status: 400 }
        );
      }
    }

    const contactPhone =
      body.contactPhone && isValidPhone(body.contactPhone) ? body.contactPhone : undefined;

    const designNiches =
      body.designNiches?.filter((niche) => validateEnumValue(DesignNiche, niche, 'designNiche')) ||
      [];

    const skills = Array.from(
      new Set(
        sanitizeArray(body.skills || [], sanitizeString)
          .map((skill) => skill.trim())
          .filter(Boolean)
      )
    );

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(passwordValue);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: body.role,
          age: typeof body.age === 'number' ? body.age : null,
          isEmailVerified: true, // Email verification disabled - accounts are immediately verified
        },
      });

      switch (body.role) {
        case UserRole.CUSTOMER:
          await tx.customer.create({
            data: {
              userId: user.id,
              gender,
              location: customerLocation,
              stylePreferences,
              bodyShape,
              languagePreference,
              budgetMin: safeOptionalNumber(body.budgetMin),
              budgetMax: safeOptionalNumber(body.budgetMax),
            },
          });
          break;

        case UserRole.DESIGNER:
          await tx.designer.create({
            data: {
              userId: user.id,
              location: body.designerLocation ? sanitizeString(body.designerLocation) : null,
              yearsExperience: typeof body.yearsExperience === 'number' ? body.yearsExperience : null,
              designNiches,
              bio: body.bio ? sanitizeHtml(body.bio) : undefined,
              languages,
              contactPhone,
              contactEmail,
              profilePhoto: body.profilePhoto ? sanitizeString(body.profilePhoto) : null,
            },
          });
          break;

        case UserRole.TAILOR:
          await tx.tailor.create({
            data: {
              userId: user.id,
              location: body.tailorLocation ? sanitizeString(body.tailorLocation) : null,
              latitude: safeOptionalNumber(body.latitude),
              longitude: safeOptionalNumber(body.longitude),
              skills,
              yearsExperience: typeof body.yearsExperience === 'number' ? body.yearsExperience : null,
              contactPhone,
              contactEmail,
              profilePhoto: body.profilePhoto ? sanitizeString(body.profilePhoto) : null,
            },
          });
          break;
      }

      return user;
    });

    // Email verification disabled - accounts are immediately verified
    console.log('✅ Account created successfully for:', result.email);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during signup. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

