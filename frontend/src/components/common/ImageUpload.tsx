'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { apiClient } from '@/clients/api'

interface ImageUploadProps {
  category: 'users' | 'patients' | 'products'
  currentImageUrl?: string
  onImageUploaded?: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

interface UploadResponse {
  success: boolean
  data?: {
    filename: string
    path: string
    url: string
  }
  error?: string
  message?: string
}

export default function ImageUpload({
  category,
  currentImageUrl,
  onImageUploaded,
  onError,
  className = '',
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      const error = 'กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)'
      setUploadError(error)
      onError?.(error)
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      const error = 'ขนาดไฟล์ต้องไม่เกิน 5MB'
      setUploadError(error)
      onError?.(error)
      return
    }

    // Clear previous errors
    setUploadError(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const response = await apiClient.uploadFile<UploadResponse>(
        `/upload/image/${category}`,
        file
      )

      if (response.success && response.data) {
        onImageUploaded?.(response.data.url)
      } else {
        throw new Error(response.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพโหลด'
      setUploadError(errorMessage)
      onError?.(errorMessage)
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    setUploadError(null)
    onImageUploaded?.('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-300"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                disabled={disabled || isUploading}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="เปลี่ยนรูปภาพ"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="ลบรูปภาพ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <span className="text-sm text-gray-600">กำลังอัพโหลด...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-sm">กำลังอัพโหลด...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">คลิกเพื่อเลือกรูปภาพ</span>
              <span className="text-xs text-gray-400 mt-1">
                JPEG, PNG, GIF, WebP (ไม่เกิน 5MB)
              </span>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-700">{uploadError}</span>
        </div>
      )}
    </div>
  )
}
