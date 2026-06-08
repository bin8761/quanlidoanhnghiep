import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import Modal from './Modal'
import { useAuth } from '../../auth/auth-context'

export default function QrScannerModal({ onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const scannerRef = useRef(null)

  const handleScanResult = useCallback((decodedText) => {
    let code = null
    try {
      // Parse URL if scanned text is a URL
      const url = new URL(decodedText)
      const pathParts = url.pathname.split('/')
      const assetsIndex = pathParts.indexOf('assets')
      if (assetsIndex !== -1 && pathParts[assetsIndex + 1]) {
        code = pathParts[assetsIndex + 1]
      }
    } catch {
      // Otherwise treat scanned text as raw asset code
      if (decodedText && decodedText.trim()) {
        code = decodedText.trim()
      }
    }

    if (code) {
      const stopPromise = (scannerRef.current && scannerRef.current.isScanning)
        ? scannerRef.current.stop()
        : Promise.resolve()

      stopPromise.then(() => {
        onClose()
        if (user?.role === 'ADMIN') {
          navigate(`/admin/assets?search=${code}`)
        } else {
          navigate(`/employee/assets/${code}`)
        }
      }).catch((err) => {
        console.error('Failed to stop scanner after success:', err)
        onClose()
        if (user?.role === 'ADMIN') {
          navigate(`/admin/assets?search=${code}`)
        } else {
          navigate(`/employee/assets/${code}`)
        }
      })
    }
  }, [navigate, onClose, user])

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file-temp')
      const decodedText = await html5QrCode.scanFile(file, false)
      handleScanResult(decodedText)
    } catch (err) {
      console.error('File scan error:', err)
      setError('Không tìm thấy mã QR trong ảnh này. Vui lòng chọn ảnh rõ nét hơn.')
    }
  }, [handleScanResult])

  useEffect(() => {
    const scannerId = 'qr-reader'
    let html5QrCode = null

    async function startScanner() {
      try {
        html5QrCode = new Html5Qrcode(scannerId)
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
          },
          (decodedText) => {
            handleScanResult(decodedText)
          },
          () => {
            // Error callback (called repeatedly, safe to ignore)
          }
        )
        setIsCameraActive(true)
      } catch (err) {
        console.error('Camera access error:', err)
        setError('Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị.')
      }
    }

    // Delay start slightly to let the modal mount its DOM element
    const timer = setTimeout(startScanner, 100)

    return () => {
      clearTimeout(timer)
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error('Failed to stop scanner on unmount:', err))
      }
    }
  }, [handleScanResult])

  return (
    <Modal title="Quét mã QR tài sản" description="Di chuyển mã QR của tài sản vào khung ngắm camera." onClose={onClose}>
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        @keyframes scan {
          0%, 100% {
            transform: translateY(10px);
          }
          50% {
            transform: translateY(170px);
          }
        }
      `}</style>

      <div className="flex flex-col items-center">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 aspect-square">
            <div id="qr-reader" className="size-full" />
            
            {/* Custom Viewfinder Overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-950/25">
                <div className="size-48 rounded-2xl border-2 border-white/50 relative">
                  {/* Corner highlights */}
                  <div className="absolute -top-1 -left-1 size-5 border-t-4 border-l-4 border-brand-500 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 size-5 border-t-4 border-r-4 border-brand-500 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-brand-500 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-brand-500 rounded-br-md" />
                  
                  {/* Laser scanner animation line */}
                  <div className="absolute inset-x-2 top-0 h-0.5 bg-brand-500 shadow-[0_0_8px_#3b82f6]" style={{
                    animation: 'scan 2s linear infinite'
                  }} />
                </div>
              </div>
            )}

            {!isCameraActive && (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/70 text-xs font-semibold text-slate-300">
                Đang khởi động camera...
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          Đóng Camera
        </button>

        <div className="mt-4 flex flex-col items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition cursor-pointer">
            <span>Hoặc chọn ảnh mã QR đã tải xuống</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div id="qr-reader-file-temp" className="hidden" />
      </div>
    </Modal>
  )
}
