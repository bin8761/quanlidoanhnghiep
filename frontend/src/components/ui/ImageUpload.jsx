import React, { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { assetApi } from '../../api/assets'
import { API_BASE_URL } from '../../api/client'

export default function ImageUpload({ label, value, onChange, error }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  // Hàm chuyển đổi đường dẫn ảnh tương đối thành tuyệt đối để hiển thị
  const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url
    }
    // Ghép host của API (bỏ đoạn '/api') để trỏ đúng thư mục static tĩnh của backend
    const host = API_BASE_URL.replace('/api', '')
    return `${host}${url}`
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    await uploadFile(file)
  }

  const uploadFile = async (file) => {
    // 1. Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setUploadError('Tệp tải lên phải là hình ảnh (PNG, JPG, WEBP).')
      return
    }

    // 2. Giới hạn dung lượng 5MB phía client
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước ảnh không được vượt quá 5MB.')
      return
    }

    setUploadError('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const result = await assetApi.uploadImage(formData)
      if (result && result.imageUrl) {
        onChange(result.imageUrl)
      } else {
        throw new Error('Không nhận được đường dẫn ảnh từ server.')
      }
    } catch (err) {
      console.error(err)
      setUploadError(err.message || 'Lỗi tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = getFullImageUrl(value)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-bold text-slate-700">{label}</label>}

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-all duration-200 
          ${displayUrl ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-slate-50'}
          ${error || uploadError ? 'border-red-300 bg-red-50/10' : ''}
          ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="size-8 animate-spin text-brand-600" />
            <span className="text-xs font-semibold">Đang tải và tối ưu hóa ảnh...</span>
          </div>
        ) : displayUrl ? (
          // Preview ảnh
          <div className="group relative flex size-full items-center justify-center">
            <img
              src={displayUrl}
              alt="Asset Preview"
              className="max-h-[160px] max-w-full rounded-lg object-contain shadow-sm"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://placehold.co/600x400?text=Loi+hien+thi+anh'
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-0 right-0 grid size-7 place-items-center rounded-full bg-slate-900/80 text-white shadow-md transition hover:bg-red-600"
              title="Xóa ảnh"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          // Trạng thái trống
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Upload size={18} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-600">Click để chọn hoặc kéo thả ảnh vào đây</p>
              <p className="mt-0.5 text-[10px] text-slate-400">PNG, JPG, WEBP tối đa 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Thông báo lỗi */}
      {(error || uploadError) && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
          <AlertCircle size={12} className="shrink-0" />
          {error || uploadError}
        </p>
      )}
    </div>
  )
}
