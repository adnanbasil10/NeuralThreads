import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder structure
export const CLOUDINARY_FOLDERS = {
  portfolios: 'neural-threads/portfolios',
  samples: 'neural-threads/samples',
  wardrobe: 'neural-threads/wardrobe',
  profiles: 'neural-threads/profiles',
  tryon: 'neural-threads/tryon',
  chat: 'neural-threads/chat',
} as const;

export type CloudinaryFolder = keyof typeof CLOUDINARY_FOLDERS;

// Upload result interface
export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// Transformation options
export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  gravity?: 'auto' | 'face' | 'center';
}

/**
 * Upload an image to Cloudinary
 * @param base64Data - Base64 encoded image data
 * @param folder - Cloudinary folder to upload to
 * @param options - Optional transformation options
 * @returns Upload result with URL and public ID
 */
export async function uploadImage(
  base64Data: string,
  folder: CloudinaryFolder,
  options?: TransformOptions
): Promise<UploadResult> {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const missing = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
    throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
  }

  try {
    const folderPath = CLOUDINARY_FOLDERS[folder];
    
    // Build transformation options
    const transformation: Record<string, any>[] = [];
    
    if (options) {
      const t: Record<string, any> = {};
      if (options.width) t.width = options.width;
      if (options.height) t.height = options.height;
      if (options.crop) t.crop = options.crop;
      if (options.quality) t.quality = options.quality;
      if (options.format) t.fetch_format = options.format;
      if (options.gravity) t.gravity = options.gravity;
      if (Object.keys(t).length > 0) transformation.push(t);
    }

    // Default optimizations
    transformation.push({ quality: 'auto', fetch_format: 'auto' });

    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folderPath,
      transformation: transformation.length > 0 ? transformation : undefined,
      resource_type: 'image',
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image to Cloudinary';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Check for common Cloudinary errors
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
      errorMessage = 'Invalid Cloudinary API credentials. Please check your configuration.';
    } else if (errorMessage.includes('Invalid cloud name')) {
      errorMessage = 'Invalid Cloudinary cloud name. Please check your configuration.';
    } else if (errorMessage.includes('Network') || errorMessage.includes('timeout')) {
      errorMessage = 'Network error connecting to Cloudinary. Please try again.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param images - Array of base64 encoded images
 * @param folder - Cloudinary folder to upload to
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  images: string[],
  folder: CloudinaryFolder
): Promise<UploadResult[]> {
  const results = await Promise.all(
    images.map((image) => uploadImage(image, folder))
  );
  return results;
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Success status
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @returns Number of successfully deleted images
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<number> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return Object.values(result.deleted).filter((r) => r === 'deleted').length;
  } catch (error) {
    console.error('Cloudinary batch delete error:', error);
    return 0;
  }
}

/**
 * Get a transformed URL for an existing image
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns Transformed image URL
 */
export function getTransformedUrl(
  publicId: string,
  options: TransformOptions
): string {
  const transformation: Record<string, any> = {};
  
  if (options.width) transformation.width = options.width;
  if (options.height) transformation.height = options.height;
  if (options.crop) transformation.crop = options.crop;
  if (options.quality) transformation.quality = options.quality;
  if (options.format) transformation.fetch_format = options.format;
  if (options.gravity) transformation.gravity = options.gravity;

  return cloudinary.url(publicId, {
    transformation: [transformation],
    secure: true,
  });
}

/**
 * Get thumbnail URL for an image
 * @param publicId - The public ID of the image
 * @param size - Thumbnail size (default 150)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(publicId: string, size: number = 150): string {
  return getTransformedUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get optimized URL for web display
 * @param publicId - The public ID of the image
 * @param maxWidth - Maximum width (default 1200)
 * @returns Optimized URL
 */
export function getOptimizedUrl(publicId: string, maxWidth: number = 1200): string {
  return getTransformedUrl(publicId, {
    width: maxWidth,
    crop: 'scale',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get profile photo URL with face detection
 * @param publicId - The public ID of the image
 * @param size - Size of the profile photo (default 200)
 * @returns Profile photo URL
 */
export function getProfilePhotoUrl(publicId: string, size: number = 200): string {
  return getTransformedUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: {
  type: string;
  size: number;
  name?: string;
}): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size: 5MB',
    };
  }

  return { valid: true };
}

/**
 * Convert File to base64
 * @param file - File to convert
 * @returns Base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Export cloudinary instance for advanced usage
export { cloudinary };




