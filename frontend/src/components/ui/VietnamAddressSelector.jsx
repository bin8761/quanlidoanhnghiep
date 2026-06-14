import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronDown, X } from 'lucide-react'

const API_BASE = 'https://provinces.open-api.vn/api'

async function fetchProvinces() {
  const res = await fetch(`${API_BASE}/?depth=1`)
  if (!res.ok) throw new Error('Không thể tải danh sách tỉnh/thành')
  return res.json()
}

async function fetchDistricts(provinceCode) {
  const res = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`)
  if (!res.ok) throw new Error('Không thể tải danh sách quận/huyện')
  const data = await res.json()
  return data.districts || []
}

async function fetchWards(districtCode) {
  const res = await fetch(`${API_BASE}/d/${districtCode}?depth=2`)
  if (!res.ok) throw new Error('Không thể tải danh sách phường/xã')
  const data = await res.json()
  return data.wards || []
}

function buildAddressString({ province, district, ward, street }) {
  const parts = [street, ward, district, province].filter(Boolean)
  return parts.join(', ')
}

/**
 * VietnamAddressSelector
 * Props:
 *   value: string (current stored address string)
 *   onChange: (newAddressString: string) => void
 *   label: string
 *   includeStreet: boolean — true = full address (province+district+ward+street), false = hometown only (province only)
 *   disabled: boolean
 *   hint: string
 */
export default function VietnamAddressSelector({
  value = '',
  onChange,
  label = 'Địa chỉ',
  includeStreet = true,
  disabled = false,
  hint,
}) {
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedWard, setSelectedWard] = useState(null)
  const [street, setStreet] = useState('')

  const [loadingProv, setLoadingProv] = useState(false)
  const [loadingDist, setLoadingDist] = useState(false)
  const [loadingWard, setLoadingWard] = useState(false)
  const [apiError, setApiError] = useState('')

  // Collapsed / expanded state
  const [isExpanded, setIsExpanded] = useState(false)

  // Ref to track if we're in a "restore from existing value" flow
  const hasRestoredRef = useRef(false)

  useEffect(() => {
    setLoadingProv(true)
    fetchProvinces()
      .then(setProvinces)
      .catch(() => setApiError('Không thể kết nối API địa chỉ'))
      .finally(() => setLoadingProv(false))
  }, [])

  // When province changes → load districts
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([])
      setSelectedDistrict(null)
      setWards([])
      setSelectedWard(null)
      return
    }
    setLoadingDist(true)
    fetchDistricts(selectedProvince.code)
      .then(setDistricts)
      .catch(() => setApiError('Không thể tải quận/huyện'))
      .finally(() => setLoadingDist(false))
  }, [selectedProvince])

  // When district changes → load wards
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([])
      setSelectedWard(null)
      return
    }
    setLoadingWard(true)
    fetchWards(selectedDistrict.code)
      .then(setWards)
      .catch(() => setApiError('Không thể tải phường/xã'))
      .finally(() => setLoadingWard(false))
  }, [selectedDistrict])

  // When selection changes → emit new value
  useEffect(() => {
    if (!hasRestoredRef.current) return
    const newVal = buildAddressString({
      province: selectedProvince?.name,
      district: selectedDistrict?.name,
      ward: selectedWard?.name,
      street: includeStreet ? street : undefined,
    })
    onChange(newVal)
  }, [selectedProvince, selectedDistrict, selectedWard, street])

  function handleReset() {
    hasRestoredRef.current = true
    setSelectedProvince(null)
    setSelectedDistrict(null)
    setSelectedWard(null)
    setStreet('')
    onChange('')
  }

  const selectClass = [
    'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2',
    'text-sm text-slate-900 shadow-sm outline-none transition-all duration-200',
    'hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12',
    'dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-emerald-500',
    disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400 pointer-events-none dark:bg-slate-800 dark:text-slate-500' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="grid gap-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>

      {/* Current value display + expand toggle */}
      <div
        className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3.5 py-2 text-sm shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/55 dark:hover:border-slate-600 ${
          disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500' : ''
        }`}
        onClick={() => !disabled && setIsExpanded(v => !v)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') !disabled && setIsExpanded(v => !v) }}
        aria-expanded={isExpanded}
      >
        <MapPin size={14} className={`shrink-0 ${value ? 'text-brand-600' : 'text-slate-300'}`} />
        <span className={`flex-1 truncate ${value ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 italic'} text-xs`}>
          {value || 'Chưa chọn địa chỉ — bấm để chọn'}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); handleReset() }}
            className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
            title="Xóa địa chỉ"
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded Picker */}
      {isExpanded && !disabled && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/35">
          {apiError && (
            <p className="text-xs text-red-500 font-medium">{apiError} — Vui lòng nhập địa chỉ thủ công bên dưới.</p>
          )}

          {/* Province */}
          <div className="grid gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tỉnh / Thành phố</label>
            <select
              className={selectClass}
              value={selectedProvince?.code ?? ''}
              disabled={loadingProv || disabled}
              onChange={e => {
                hasRestoredRef.current = true
                const prov = provinces.find(p => String(p.code) === e.target.value) || null
                setSelectedProvince(prov)
                setSelectedDistrict(null)
                setSelectedWard(null)
              }}
            >
              <option value="">{loadingProv ? 'Đang tải...' : '-- Chọn tỉnh/thành --'}</option>
              {provinces.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* District */}
          {includeStreet && selectedProvince && (
            <div className="grid gap-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Quận / Huyện</label>
              <select
                className={selectClass}
                value={selectedDistrict?.code ?? ''}
                disabled={loadingDist || !selectedProvince || disabled}
                onChange={e => {
                  hasRestoredRef.current = true
                  const dist = districts.find(d => String(d.code) === e.target.value) || null
                  setSelectedDistrict(dist)
                  setSelectedWard(null)
                }}
              >
                <option value="">{loadingDist ? 'Đang tải...' : '-- Chọn quận/huyện --'}</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ward */}
          {includeStreet && selectedDistrict && (
            <div className="grid gap-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Phường / Xã / Thị trấn</label>
              <select
                className={selectClass}
                value={selectedWard?.code ?? ''}
                disabled={loadingWard || !selectedDistrict || disabled}
                onChange={e => {
                  hasRestoredRef.current = true
                  const ward = wards.find(w => String(w.code) === e.target.value) || null
                  setSelectedWard(ward)
                }}
              >
                <option value="">{loadingWard ? 'Đang tải...' : '-- Chọn phường/xã --'}</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Street */}
          {includeStreet && (
            <div className="grid gap-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Số nhà, đường, ngõ/hẻm</label>
              <input
                type="text"
                className={selectClass}
                placeholder="VD: 12 Ngõ 5, Đường Lê Lợi"
                value={street}
                disabled={disabled}
                onChange={e => {
                  hasRestoredRef.current = true
                  setStreet(e.target.value)
                }}
              />
            </div>
          )}

          {/* Fallback manual input */}
          {apiError && (
            <div className="grid gap-1 border-t pt-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nhập địa chỉ thủ công</label>
              <input
                type="text"
                className={selectClass}
                placeholder="Nhập địa chỉ đầy đủ..."
                value={value}
                disabled={disabled}
                onChange={e => onChange(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="w-full rounded-lg bg-brand-600 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
          >
            ✓ Xác nhận địa chỉ
          </button>
        </div>
      )}
    </div>
  )
}
