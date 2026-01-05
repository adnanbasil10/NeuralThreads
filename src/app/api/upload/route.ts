import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import {
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
  CLOUDINARY_FOLDERS,
  CloudinaryFolder,
} from '@/lib/cloudinary';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { scanBufferForMalware } from '@/lib/security/malware';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

async function verifyRequester(request: NextRequest) {
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
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await enforceRateLimit(request, apiLimiter, user.userId);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, message: 'Too many upload attempts. Please slow down.' },
        {
          status: error.statusCode,
          headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
        }
      );
    }
    throw error;
  }

  return { user };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyRequester(request);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = formData.get('folder') as string;

    if (!folder || !Object.keys(CLOUDINARY_FOLDERS).includes(folder)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid folder. Allowed: ' + Object.keys(CLOUDINARY_FOLDERS).join(', '),
        },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    const validatedFiles: { file: File; base64: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: JPEG, PNG, WebP, GIF`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size: 5MB`);
        continue;
      }

      const validation = validateImageFile(file);
      if (!validation.valid && validation.error) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await scanBufferForMalware(buffer);

      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      validatedFiles.push({ file, base64 });
    }

    if (validatedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid files to upload',
          errors,
        },
        { status: 400 }
      );
    }

    const uploadResults = await uploadMultipleImages(
      validatedFiles.map((f) => f.base64),
      folder as CloudinaryFolder
    );

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadResults.length} file(s)`,
      data: uploadResults.map((result, index) => ({
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        originalName: validatedFiles[index].file.name,
      })),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload files';
    let statusCode = 500;
    
    if (error?.message) {
      errorMessage = error.message;
      
      // Check for configuration errors
      if (errorMessage.includes('Cloudinary is not configured') || errorMessage.includes('Missing:')) {
        statusCode = 500;
        errorMessage = 'Image upload service is not configured. Please contact support.';
      } else if (errorMessage.includes('Invalid Cloudinary') || errorMessage.includes('API credentials')) {
        statusCode = 500;
        errorMessage = 'Image upload service configuration error. Please contact support.';
      } else if (errorMessage.includes('Network error')) {
        statusCode = 503;
        errorMessage = 'Unable to connect to image upload service. Please try again later.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: error?.message || 'Unknown error occurred'
      },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyRequester(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { base64, folder } = body;

    if (!folder || !Object.keys(CLOUDINARY_FOLDERS).includes(folder)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid folder',
        },
        { status: 400 }
      );
    }

    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid image data' },
        { status: 400 }
      );
    }

    const base64Regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
    if (!base64Regex.test(base64)) {
      return NextResponse.json(
        { success: false, message: 'Invalid image format' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64.split(',')[1], 'base64');
    await scanBufferForMalware(buffer);

    const result = await uploadImage(base64, folder as CloudinaryFolder);

    return NextResponse.json({
      success: true,
      data: {
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
