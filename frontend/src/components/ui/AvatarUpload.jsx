import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, X, User } from 'lucide-react'
import { assetApi } from '../../api/assets'
import { API_BASE_URL } from '../../api/client'

function getFullImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  // Strip trailing /api from base URL to get the static file host
  const host = API_BASE_URL.replace(/\/api$/, '')
  return `${host}${url}`
}

/**
 * AvatarUpload
 * Props:
 *   value: string (current avatarUrl)
 *   onChange: (newUrl: string) => void
 *   name: string — employee name for initials fallback
 *   size: 'sm' | 'md' | 'lg' (default 'lg')
 *   disabled: boolean
 *   showLabel: boolean
 */
export default function AvatarUpload({
  value = '',
  onChange,
  name = '',
  size = 'lg',
  disabled = false,
  showLabel = true,
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setImgError(false)
  }, [value])

  const displayUrl = getFullImageUrl(value)

  // Generate initials from name
  const initials = name
    ? name.split(' ').slice(-2).map(p => p[0]?.toUpperCase() || '').join('')
    : '?'

  const sizeMap = {
    sm: { outer: 'size-16', text: 'text-lg', icon: 14, badge: 'size-5 bottom-0 right-0', badgeIcon: 8 },
    md: { outer: 'size-24', text: 'text-2xl', icon: 18, badge: 'size-6 bottom-0 right-0', badgeIcon: 10 },
    lg: { outer: 'size-28', text: 'text-3xl', icon: 22, badge: 'size-8 -bottom-1 -right-1', badgeIcon: 13 },
  }
  const sz = sizeMap[size] || sizeMap.lg

  async function uploadFile(file) {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ hỗ trợ ảnh PNG, JPG, WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tối đa 5MB.')
      return
    }
    setError('')
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const result = await assetApi.uploadImage(formData)
      if (result?.imageUrl) {
        await onChange(result.imageUrl)
      } else {
        throw new Error('Không nhận được đường dẫn ảnh.')
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải ảnh. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  async function handleClear(e) {
    e.stopPropagation()
    setError('')
    setIsUploading(true)
    try {
      await onChange('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message || 'Không thể xóa ảnh đại diện.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Circle */}
      <div
        className={`relative ${sz.outer} shrink-0`}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Main circle */}
        <button
          type="button"
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={[
            `${sz.outer} rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 transition-all duration-200 focus:outline-none block`,
            disabled ? 'cursor-default ring-slate-200' : 'cursor-pointer hover:ring-brand-400 ring-slate-200',
            dragOver ? 'ring-brand-500 scale-105' : '',
          ].join(' ')}
          title={disabled ? 'Không có quyền đổi ảnh' : 'Bấm hoặc kéo thả ảnh để đổi avatar'}
        >
          {isUploading ? (
            <div className="flex size-full items-center justify-center bg-slate-100">
              <Loader2 size={sz.icon} className="animate-spin text-brand-600" />
            </div>
          ) : (displayUrl && !imgError) ? (
            <img
              src={displayUrl}
              alt={name || 'Avatar'}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
              <span className={`${sz.text} font-extrabold text-white select-none`}>{initials}</span>
            </div>
          )}
        </button>

        {/* Camera badge */}
        {!disabled && (
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className={`absolute ${sz.badge} grid place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow-md transition hover:bg-brand-700`}
            title="Đổi ảnh đại diện"
          >
            <Camera size={sz.badgeIcon} />
          </button>
        )}

        {/* Remove button (only if has avatar and not disabled) */}
        {displayUrl && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-red-500 text-white shadow transition hover:bg-red-600"
            title="Xóa ảnh đại diện"
          >
            <X size={8} />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>

      {/* Label & hint */}
      {showLabel && (
        <div className="text-center">
          {!disabled && (
            <p className="text-[11px] text-slate-400">
              {isUploading ? 'Đang tải lên...' : 'Bấm hoặc kéo thả ảnh — PNG/JPG/WEBP ≤ 5MB'}
            </p>
          )}
          {error && (
            <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
