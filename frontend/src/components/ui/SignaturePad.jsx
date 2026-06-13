import { useRef, useEffect, useState } from 'react'
import { Eraser, PenTool } from 'lucide-react'

export default function SignaturePad({ onChange, disabled = false }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // Get mouse/touch coordinates relative to canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    // Support touch
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    // Support mouse
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    if (disabled) return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || disabled) return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setIsEmpty(false)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    // Send base64 data to parent
    if (onChange && !isEmpty) {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      onChange(dataUrl)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    if (onChange) {
      onChange(null)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Adjust canvas resolution for high DPI displays
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    
    // Set drawing styles
    ctx.strokeStyle = '#0f172a' // Slate 900
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white shadow-inner dark:border-slate-600 dark:bg-slate-100">
        <canvas
          ref={canvasRef}
          className="block h-40 w-full cursor-crosshair touch-none bg-transparent"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <PenTool size={20} className="stroke-[1.5] text-slate-400" />
            <span className="mt-1.5 text-xs font-medium">Ký tên của bạn tại đây</span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled || isEmpty}
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:hover:text-slate-500 transition"
        >
          <Eraser size={12} />
          Xóa chữ ký
        </button>
      </div>
    </div>
  )
}
