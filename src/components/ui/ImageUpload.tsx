'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Plus,
} from 'lucide-react';
import { useSecureFetch } from '@/hooks';

// Types
interface UploadedImage {
  url: string;
  publicId: string;
  preview?: string;
  originalName?: string;
}

interface ImageUploadProps {
  folder: 'portfolios' | 'samples' | 'wardrobe' | 'profiles' | 'tryon' | 'chat';
  onUpload: (images: UploadedImage[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  existingImages?: UploadedImage[];
  onRemove?: (index: number) => void;
  variant?: 'default' | 'profile' | 'compact' | 'gallery';
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  label?: string;
  hint?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function ImageUpload({
  folder,
  onUpload,
  onError,
  maxFiles = 5,
  maxSize = 5,
  existingImages = [],
  onRemove,
  variant = 'default',
  className = '',
  disabled = false,
  showPreview = true,
  label,
  hint,
}: ImageUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { secureFetch, isFetchingCsrfToken } = useSecureFetch();

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || uploading || isFetchingCsrfToken) return;

      // Check max files
      const totalFiles = existingImages.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        setErrorMessage(`Maximum ${maxFiles} files allowed`);
        onError?.(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Add previews to files
      const filesWithPreviews = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles(filesWithPreviews);
      setErrorMessage('');
      setUploadStatus('uploading');
      setUploading(true);
      setUploadProgress(0);

      try {
        // Create form data
        const formData = new FormData();
        formData.append('folder', folder);
        acceptedFiles.forEach((file) => {
          formData.append('files', file);
        });

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        // Upload
        const response = await secureFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const data = await response.json();

        if (data.success) {
          setUploadStatus('success');
          onUpload(data.data);
          
          // Reset after success
          setTimeout(() => {
            setFiles([]);
            setUploadStatus('idle');
            setUploadProgress(0);
          }, 1500);
        } else {
          setUploadStatus('error');
          setErrorMessage(data.message || 'Upload failed');
          onError?.(data.message || 'Upload failed');
        }
      } catch (error) {
        setUploadStatus('error');
        setErrorMessage('Network error. Please try again.');
        onError?.('Network error. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [folder, onUpload, onError, maxFiles, existingImages.length, disabled, uploading]
  );

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles - existingImages.length,
    disabled: disabled || uploading,
  });

  // Remove preview
  const removeFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // Render variants
  if (variant === 'profile') {
    return (
      <div className={`relative ${className}`}>
        <div
          {...getRootProps()}
          className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all cursor-pointer group ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-200 hover:border-indigo-400 bg-gray-100'
          }`}
        >
          <input {...getInputProps()} />
          
          {existingImages[0]?.url ? (
            <img
              src={existingImages[0].url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : files[0]?.preview ? (
            <img
              src={files[0].preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {uploading && (
          <div className="absolute -bottom-2 left-0 right-0 mx-auto w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {errorMessage && (
          <p className="mt-2 text-xs text-red-500 text-center">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={className}>
        <div
          {...getRootProps()}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDragActive ? 'bg-indigo-100' : 'bg-gray-100'
          }`}>
            {uploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : uploadStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Upload className="w-5 h-5 text-gray-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {uploading
                ? 'Uploading...'
                : uploadStatus === 'success'
                ? 'Upload complete!'
                : label || 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500">
              {hint || `Max ${maxSize}MB, ${maxFiles} file(s)`}
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Default and gallery variants
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Existing images grid */}
      {showPreview && existingImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {existingImages.map((image, index) => (
            <div
              key={image.publicId || index}
              className="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {files.map((file, index) => (
            <div
              key={file.name}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200"
            >
              {file.preview && (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  {uploadStatus === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  )}
                </div>
              )}
              
              {/* Remove button (only when not uploading) */}
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {existingImages.length + files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />

          {variant === 'gallery' ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-600">Add more images</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                ) : uploadStatus === 'success' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-indigo-600" />
                )}
              </div>

              <p className="text-gray-700 font-medium mb-1">
                {isDragActive
                  ? 'Drop images here'
                  : uploading
                  ? 'Uploading...'
                  : uploadStatus === 'success'
                  ? 'Upload complete!'
                  : 'Drag & drop images here'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                or click to browse
              </p>
              <p className="text-xs text-gray-400">
                {hint || `JPEG, PNG, WebP, GIF • Max ${maxSize}MB • Up to ${maxFiles} files`}
              </p>
            </>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}

// Hook for manual upload control
export function useImageUpload(folder: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { secureFetch } = useSecureFetch();

  const upload = async (files: File[]): Promise<UploadedImage[] | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('folder', folder);
      files.forEach((file) => formData.append('files', file));

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await secureFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        setError(data.message);
        return null;
      }
    } catch (err) {
      setError('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return { upload, uploading, progress, error, reset };
}

export default ImageUpload;


