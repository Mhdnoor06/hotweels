"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  X,
  Upload,
  Loader2,
  Car,
  ImageIcon,
  Video,
  Check,
} from "lucide-react"
import type { CustomCar } from "@/lib/supabase/database.types"
import { toast } from "sonner"

interface CustomCarFormProps {
  car: CustomCar | null
  onClose: () => void
  onSave: (car: CustomCar) => void
}

export function CustomCarForm({ car, onClose, onSave }: CustomCarFormProps) {
  const isEditing = !!car
  const [formData, setFormData] = useState({
    name: car?.name || "",
    series: car?.series || "",
    description: car?.description || "",
    price: car?.price?.toString() || "",
    active: car?.active ?? true,
  })

  // For new uploads - store File objects
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  // For preview - blob URLs for new files, or existing URLs for editing
  const [imagePreview, setImagePreview] = useState<string | null>(car?.transparent_image || null)
  const [videoPreview, setVideoPreview] = useState<string | null>(car?.video_url || null)

  // Track if using existing URLs (editing) vs new files
  const [useExistingImage, setUseExistingImage] = useState(!!car?.transparent_image)
  const [useExistingVideo, setUseExistingVideo] = useState(!!car?.video_url)

  const [saving, setSaving] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview)
      }
    }
  }, [imagePreview, videoPreview])

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate PNG for transparency
    if (!file.type.includes('png')) {
      toast.warning('For best results, use a PNG file with transparent background')
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file is too large. Maximum size is 10MB')
      return
    }

    // Revoke old blob URL if exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUseExistingImage(false)
  }

  const handleVideoSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, WebM, or MOV)')
      return
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file is too large. Maximum size is 100MB')
      return
    }

    // Revoke old blob URL if exists
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview)
    }

    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
    setUseExistingVideo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a car name')
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (!imageFile && !useExistingImage) {
      toast.error('Please select a transparent car image')
      return
    }

    setSaving(true)

    try {
      let transparentImageUrl = useExistingImage ? car?.transparent_image : null
      let videoUrl = useExistingVideo ? car?.video_url : null

      // Upload new image if selected
      if (imageFile) {
        toast.loading('Uploading image...', { id: 'upload-image' })

        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('type', 'car-images')

        const response = await fetch('/api/admin/custom-cars/upload-image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload image')
        }

        const { url } = await response.json()
        transparentImageUrl = url
        toast.success('Image uploaded', { id: 'upload-image' })
      }

      // Upload new video if selected
      if (videoFile) {
        toast.loading('Uploading video...', { id: 'upload-video' })

        const formData = new FormData()
        formData.append('video', videoFile)

        const response = await fetch('/api/admin/custom-cars/upload-video', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload video')
        }

        const { url } = await response.json()
        videoUrl = url
        toast.success('Video uploaded', { id: 'upload-video' })
      }

      // Save car data
      const payload = {
        name: formData.name.trim(),
        series: formData.series.trim() || null,
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        transparent_image: transparentImageUrl,
        video_url: videoUrl,
        active: formData.active,
      }

      const url = isEditing
        ? `/api/admin/custom-cars/${car.id}`
        : '/api/admin/custom-cars'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save car')
      }

      const savedCar = await response.json()
      toast.success(isEditing ? 'Car updated successfully' : 'Car created successfully')
      onSave(savedCar)
    } catch (err) {
      console.error('Error saving car:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save car')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl z-50 shadow-xl mx-4"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Car className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Car' : 'Add New Car'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transparent Car Image (PNG) *
            </label>
            <div
              onClick={() => !saving && imageInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                imagePreview
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-32 h-32 mx-auto mb-2">
                    {imagePreview.startsWith('blob:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt="Car preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image
                        src={imagePreview}
                        alt="Car preview"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                    <Check size={14} />
                    {imageFile ? 'Image selected' : 'Image uploaded'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to select transparent PNG</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: PNG with transparent background</p>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={saving}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageSelect(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              360° Preview Video (Optional)
            </label>
            <div
              onClick={() => !saving && videoInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                videoPreview
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              {videoPreview ? (
                <div>
                  <video
                    src={videoPreview}
                    className="w-48 h-32 mx-auto rounded-lg object-cover mb-2"
                    muted
                    playsInline
                  />
                  <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                    <Check size={14} />
                    {videoFile ? 'Video selected' : 'Video uploaded'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Video className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to select video</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, WebM, or MOV (max 100MB)</p>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                disabled={saving}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleVideoSelect(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* Car Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 1967 Camaro SS"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Series / Category
              </label>
              <input
                type="text"
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                placeholder="e.g., Muscle Cars"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter car description..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="599"
                min="0"
                step="0.01"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center gap-3 h-[50px]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: true })}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                    formData.active
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: false })}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                    !formData.active
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {isEditing ? 'Update Car' : 'Add Car'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}
