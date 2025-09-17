"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GraphQLAPI } from "@/clients/graphql"

interface ProductImageUploadProps {
  value?: File | string | null
  onChange: (file: File | null, url?: string) => void
  currentImageUrl?: string
  disabled?: boolean
  label?: string
  description?: string
}

export default function ProductImageUpload({
  value,
  onChange,
  currentImageUrl,
  disabled = false,
  label = "รูปภาพสินค้า",
  description = "รูปภาพจะถูกปรับขนาดเป็น 160x160 พิกเซลโดยอัตโนมัติ (ขนาดไม่เกิน 2MB)"
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Component mounted
  }, [])

  // Function to resize and crop image to 160x160
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size to 160x160
        canvas.width = 160
        canvas.height = 160
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Calculate crop dimensions to maintain aspect ratio and center crop
        const aspectRatio = img.width / img.height
        let sourceX = 0
        let sourceY = 0
        let sourceWidth = img.width
        let sourceHeight = img.height
        
        if (aspectRatio > 1) {
          // Image is wider than tall
          sourceWidth = img.height
          sourceX = (img.width - sourceWidth) / 2
        } else {
          // Image is taller than wide
          sourceHeight = img.width
          sourceY = (img.height - sourceHeight) / 2
        }
        
        // Draw the cropped and resized image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, 160, 160
        )
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file with resized image
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to create resized image'))
          }
        }, 'image/jpeg', 0.9) // 90% quality
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      // Load the image
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered', e.target.files)
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }
    console.log('File selected:', file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 2MB')
      return
    }

    setError(null)
    setIsResizing(true)
    
    try {
      // Resize image to 160x160
      const resizedFile = await resizeImage(file)
      console.log('Image resized:', resizedFile.name, resizedFile.size)
      
      // Set selected file name
      setSelectedFileName(resizedFile.name)
      
      // Create preview URL from resized file
      const preview = URL.createObjectURL(resizedFile)
      setPreviewUrl(preview)
      
      // Call onChange with resized file
      onChange(resizedFile)
    } catch (error) {
      console.error('Error resizing image:', error)
      setError('ไม่สามารถปรับขนาดรูปภาพได้ กรุณาลองใหม่')
    } finally {
      setIsResizing(false)
    }
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setError(null)
    setSelectedFileName(null)
    onChange(null)
  }

  const getDisplayUrl = () => {
    if (previewUrl) return previewUrl
    if (value && typeof value === 'string') return value
    if (currentImageUrl) return currentImageUrl
    return null
  }

  const getDisplayFileName = () => {
    if (selectedFileName) return selectedFileName
    if (currentImageUrl) {
      // Extract filename from URL
      const urlParts = currentImageUrl.split('/')
      return urlParts[urlParts.length - 1] || 'รูปภาพปัจจุบัน'
    }
    return null
  }

  const displayUrl = getDisplayUrl()
  const displayFileName = getDisplayFileName()
  
  // Debug logs for troubleshooting
  console.log('ProductImageUpload - Display URL:', displayUrl)
  console.log('ProductImageUpload - value:', value)
  console.log('ProductImageUpload - currentImageUrl:', currentImageUrl)
  console.log('ProductImageUpload - previewUrl:', previewUrl)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading || isResizing}
      />
      
      <div className="flex items-start space-x-4">
        {/* Upload Area */}
        <div className="relative group">
          <div className="w-48 h-48 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
            {displayUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={displayUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  style={{ 
                    backgroundColor: 'transparent',
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', displayUrl)
                    console.error('Error event:', e)
                    e.currentTarget.style.display = 'none'
                    // Show fallback content
                    if (fallbackRef.current) {
                      fallbackRef.current.classList.remove('hidden')
                    }
                  }}
                  onLoad={(e) => {
                    console.log('Image loaded successfully:', displayUrl)
                    console.log('Image element:', e.currentTarget)
                    console.log('Image natural dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight)
                  }}
                />
                
                {/* Fallback content when image fails to load */}
                <div ref={fallbackRef} className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 hidden">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-sm">ไม่สามารถแสดงรูปภาพได้</div>
                    <div className="text-xs mt-1 break-all px-2">{displayUrl}</div>
                  </div>
                </div>
                
                {/* Action buttons - positioned outside the image area */}
                {!disabled && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Edit Button */}
                    <button
                      type="button"
                      className="cursor-pointer group/edit relative"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      disabled={disabled || isUploading || isResizing}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 hover:scale-110 transition-all duration-200 shadow-lg group-hover/edit:shadow-xl">
                        <Edit2 className="h-3 w-3 text-gray-700 group-hover/edit:text-teal-600" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Loading overlay */}
                {(isUploading || isResizing) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                    <div className="text-white text-sm">
                      {isResizing ? 'กำลังปรับขนาดรูปภาพ...' : 'กำลังอัพโหลด...'}
                    </div>
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                    แก้ไขรูปภาพ
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center p-4">
                {(isUploading || isResizing) ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
                    <div className="text-sm text-gray-600">
                      {isResizing ? 'กำลังปรับขนาดรูปภาพ...' : 'กำลังอัพโหลด...'}
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <button
                        type="button"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500"
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                        disabled={disabled || isUploading || isResizing}
                      >
                        อัพโหลดรูปภาพ
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{description}</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* File Name Display */}
          {displayFileName && (
            <div className="mt-2 text-center">
              <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-md inline-block">
                <span className="font-medium">
                  {selectedFileName ? 'ไฟล์ที่เลือก:' : 'รูปภาพปัจจุบัน:'}
                </span> {displayFileName}
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="flex-1 space-y-3">
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <ImageIcon className="h-4 w-4" />
              <span className="font-medium">คำแนะนำการอัพโหลด</span>
            </div>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• รูปแบบไฟล์: JPG, PNG, GIF</li>
              <li>• ขนาดไฟล์: ไม่เกิน 2MB</li>
              <li>• ขนาดภาพ: แนะนำ 160x160 พิกเซล หรือสัดส่วน 1:1</li>
              <li>• ภาพจะแสดงใน POS และหน้ารายละเอียดสินค้า</li>
            </ul>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          {displayUrl && !isUploading && !isResizing && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
              ✓ รูปภาพพร้อมใช้งาน (ปรับขนาดเป็น 160x160 แล้ว)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
