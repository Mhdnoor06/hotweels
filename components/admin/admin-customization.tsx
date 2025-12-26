"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Car,
  ImageIcon,
  Globe,
  Upload,
  X,
  Play,
} from "lucide-react"
import type { CustomCar, CustomBackground } from "@/lib/supabase/database.types"
import { AdminPageHeader } from "./admin-page-header"
import { CustomCarForm } from "./custom-car-form"
import { toast } from "sonner"

interface CustomCarWithBackgrounds extends CustomCar {
  backgrounds: CustomBackground[]
}

export function AdminCustomization() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const [cars, setCars] = useState<CustomCarWithBackgrounds[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCar, setExpandedCar] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ type: 'car' | 'background'; id: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCarForm, setShowCarForm] = useState(false)
  const [editingCar, setEditingCar] = useState<CustomCar | null>(null)
  const [uploadingBackground, setUploadingBackground] = useState<string | null>(null)
  const [activeBackground, setActiveBackground] = useState<string | null>(null)

  const fetchCars = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/custom-cars', { credentials: 'include' })
      const data = await response.json()
      if (Array.isArray(data)) {
        setCars(data)
      }
    } catch (err) {
      console.error('Error fetching custom cars:', err)
      toast.error('Failed to fetch cars')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    fetchCars()
  }, [router, isAuthenticated, authLoading, fetchCars])

  // Close mobile overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (activeBackground && !(e.target as Element).closest('[data-background-card]')) {
        setActiveBackground(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [activeBackground])

  const handleDeleteCar = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/custom-cars/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        setCars((prev) => prev.filter((c) => c.id !== id))
        setDeleteModal(null)
        toast.success('Car deleted successfully')
      } else {
        toast.error('Failed to delete car')
      }
    } catch (err) {
      console.error('Error deleting car:', err)
      toast.error('Failed to delete car')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteBackground = async (id: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/custom-backgrounds/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        setCars((prev) =>
          prev.map((car) => ({
            ...car,
            backgrounds: car.backgrounds.filter((bg) => bg.id !== id),
          }))
        )
        setDeleteModal(null)
        toast.success('Background deleted successfully')
      } else {
        toast.error('Failed to delete background')
      }
    } catch (err) {
      console.error('Error deleting background:', err)
      toast.error('Failed to delete background')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleCommon = async (background: CustomBackground) => {
    try {
      const response = await fetch(`/api/admin/custom-backgrounds/${background.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_common: !background.is_common }),
      })
      if (response.ok) {
        setCars((prev) =>
          prev.map((car) => ({
            ...car,
            backgrounds: car.backgrounds.map((bg) =>
              bg.id === background.id ? { ...bg, is_common: !bg.is_common } : bg
            ),
          }))
        )
        toast.success(background.is_common ? 'Background is now car-specific' : 'Background is now common for all cars')
      }
    } catch (err) {
      console.error('Error toggling common:', err)
      toast.error('Failed to update background')
    }
  }

  const handleUploadBackground = async (carId: string, file: File) => {
    setUploadingBackground(carId)
    try {
      // Upload image to Cloudinary
      const formData = new FormData()
      formData.append('image', file)
      formData.append('type', 'backgrounds')

      const uploadResponse = await fetch('/api/admin/custom-cars/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const { url } = await uploadResponse.json()

      // Create background record
      const bgResponse = await fetch('/api/admin/custom-backgrounds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          image: url,
          car_id: carId,
          is_common: false,
        }),
      })

      if (bgResponse.ok) {
        const newBackground = await bgResponse.json()
        setCars((prev) =>
          prev.map((car) =>
            car.id === carId
              ? { ...car, backgrounds: [newBackground, ...car.backgrounds] }
              : car
          )
        )
        toast.success('Background uploaded successfully')
      }
    } catch (err) {
      console.error('Error uploading background:', err)
      toast.error('Failed to upload background')
    } finally {
      setUploadingBackground(null)
    }
  }

  const handleCarSaved = (car: CustomCar) => {
    if (editingCar) {
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, ...car } : c))
      )
    } else {
      setCars((prev) => [{ ...car, backgrounds: [] }, ...prev])
    }
    setShowCarForm(false)
    setEditingCar(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Customization"
        icon={Palette}
        actions={
          <button
            onClick={() => {
              setEditingCar(null)
              setShowCarForm(true)
            }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Car</span>
          </button>
        }
      />

      {/* Cars List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-16">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No custom cars added yet</p>
          <button
            onClick={() => setShowCarForm(true)}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Your First Car
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Car Header */}
              <div
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCar(expandedCar === car.id ? null : car.id)}
              >
                {/* Mobile Layout - Stacked */}
                <div className="block sm:hidden p-3">
                  {/* Image - Full width on mobile */}
                  <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg overflow-hidden mb-3">
                    <Image
                      src={car.transparent_image}
                      alt={car.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">
                          {car.name}
                        </h3>
                        {!car.active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      {car.series && (
                        <p className="text-sm text-gray-500 mb-2">{car.series}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-bold text-gray-900">
                          ₹{car.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <ImageIcon size={12} />
                          {car.backgrounds.length} bg
                        </span>
                        {car.video_url && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Play size={12} />
                            Video
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="flex-shrink-0">
                      {expandedCar === car.id ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Actions - Bottom row on mobile */}
                  <div
                    className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditingCar(car)
                        setShowCarForm(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal({ type: 'car', id: car.id })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 text-sm font-medium transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Desktop Layout - Horizontal */}
                <div className="hidden sm:flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={car.transparent_image}
                      alt={car.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {car.name}
                      </h3>
                      {!car.active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {car.series && (
                      <p className="text-sm text-gray-500 truncate">{car.series}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{car.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ImageIcon size={12} />
                        {car.backgrounds.length} backgrounds
                      </span>
                      {car.video_url && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Play size={12} />
                          Video
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingCar(car)
                        setShowCarForm(true)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ type: 'car', id: car.id })}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedCar === car.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content - Backgrounds */}
              <AnimatePresence>
                {expandedCar === car.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">
                          Backgrounds for this car
                        </h4>
                        <label className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-600 cursor-pointer transition-colors">
                          {uploadingBackground === car.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                          Add Background
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingBackground === car.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadBackground(car.id, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>

                      {car.backgrounds.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No backgrounds yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {car.backgrounds.map((bg) => {
                            const isActive = activeBackground === bg.id

                            return (
                              <div
                                key={bg.id}
                                data-background-card
                                className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                                onClick={() => {
                                  // Toggle on mobile
                                  if (window.innerWidth < 640) {
                                    setActiveBackground(isActive ? null : bg.id)
                                  }
                                }}
                              >
                                {/* Full card image */}
                                <div className="absolute inset-0 bg-gray-100" />
                                <Image
                                  src={bg.image}
                                  alt={bg.name}
                                  fill
                                  className="object-contain"
                                />

                                {/* Common badge - top right */}
                                {bg.is_common && !isActive && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                    <Globe size={8} />
                                    <span>Common</span>
                                  </div>
                                )}

                                {/* Desktop: Hover overlay with actions */}
                                <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex-col justify-end p-2">
                                  {/* Name */}
                                  <p className="text-white text-xs font-medium truncate mb-2">{bg.name}</p>

                                  {/* Actions */}
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleCommon(bg)
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded font-medium transition-colors ${
                                        bg.is_common
                                          ? 'bg-green-500 text-white'
                                          : 'bg-white/90 text-gray-700 hover:bg-white'
                                      }`}
                                    >
                                      <Globe size={10} />
                                      {bg.is_common ? 'Common' : 'Make Common'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteModal({ type: 'background', id: bg.id })
                                      }}
                                      className="p-1.5 bg-red-500 hover:bg-red-600 rounded text-white transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Mobile: Tap to show overlay */}
                                <div
                                  className={`sm:hidden absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col justify-end p-2 transition-opacity duration-200 ${
                                    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                  }`}
                                >
                                  {/* Close hint */}
                                  <div className="absolute top-2 right-2">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                                      <X size={14} className="text-white" />
                                    </div>
                                  </div>

                                  {/* Name */}
                                  <p className="text-white text-xs font-medium truncate mb-2">{bg.name}</p>

                                  {/* Actions */}
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleCommon(bg)
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded font-medium transition-colors ${
                                        bg.is_common
                                          ? 'bg-green-500 text-white'
                                          : 'bg-white text-gray-700'
                                      }`}
                                    >
                                      <Globe size={10} />
                                      {bg.is_common ? 'Common' : 'Make Common'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteModal({ type: 'background', id: bg.id })
                                      }}
                                      className="p-2 bg-red-500 rounded text-white transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Mobile: Default minimal overlay (hidden when active) */}
                                <div
                                  className={`sm:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 transition-opacity duration-200 ${
                                    isActive ? 'opacity-0' : 'opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-white text-[10px] truncate flex-1 mr-2">{bg.name}</p>
                                    <div className="flex gap-1">
                                      {bg.is_common && (
                                        <div className="bg-green-500 text-white p-1 rounded">
                                          <Globe size={10} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Car Form Modal */}
      <AnimatePresence>
        {showCarForm && (
          <CustomCarForm
            car={editingCar}
            onClose={() => {
              setShowCarForm(false)
              setEditingCar(null)
            }}
            onSave={handleCarSaved}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setDeleteModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 z-50 shadow-xl mx-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Delete {deleteModal.type === 'car' ? 'Car' : 'Background'}
              </h3>
              <p className="text-gray-500 mb-6">
                {deleteModal.type === 'car'
                  ? 'Are you sure you want to delete this car? All associated backgrounds will also be deleted.'
                  : 'Are you sure you want to delete this background?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    deleteModal.type === 'car'
                      ? handleDeleteCar(deleteModal.id)
                      : handleDeleteBackground(deleteModal.id)
                  }
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
