import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Edit,
  MapPin,
  Plus,
  Trash2,
  Eye,
  Settings,
  Search,
  Save,
  X,
  XCircle,
  CheckCircle,
} from 'lucide-react'
import { locationApi } from '../../api/locations'
import { employeeApi } from '../../api/employees'
import { assetApi } from '../../api/assets'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const EMPTY_FORM = Object.freeze({ name: '', description: '', floorPlanUrl: '' })

export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationDetails, setLocationDetails] = useState(null)
  
  // Lists for pinning mode
  const [employees, setEmployees] = useState([])
  const [assets, setAssets] = useState([])
  
  // Search & Filter
  const [search, setSearch] = useState('')
  const [pinSearch, setPinSearch] = useState('')
  const [activeTab, setActiveTab] = useState('employees') // 'employees' or 'assets'
  const [selectedItemToPin, setSelectedItemToPin] = useState(null) // { type: 'employee'|'asset', item: obj }
  
  // States
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [, setError] = useState('')
  const [toast, setToast] = useState(null)
  
  // Modals & Dialogs
  const [editingLocation, setEditingLocation] = useState(null)
  const [deletingLocation, setDeletingLocation] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Interactive mode: 'view' or 'edit-pins'
  const [mode, setMode] = useState('view')
  
  // Temporary coordinate before saving
  const [tempCoords, setTempCoords] = useState(null) // { x: float, y: float }

  useAutoDismiss(toast, setToast)

  const loadLocations = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await locationApi.list()
      setLocations(data)
      // If we already have a selected location, refresh it
      if (selectedLocation) {
        const found = data.find((l) => l.id === selectedLocation.id)
        if (found) {
          setSelectedLocation(found)
          await loadLocationDetails(found.id)
        } else {
          setSelectedLocation(null)
          setLocationDetails(null)
        }
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLocation])

  // Initial load
  useEffect(() => {
    locationApi
      .list()
      .then((data) => {
        setLocations(data)
        if (data.length > 0) {
          setSelectedLocation(data[0])
          loadLocationDetails(data[0].id)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Load selected location details (includes employees with desks, and assets with locations)
  async function loadLocationDetails(id) {
    setIsDetailsLoading(true)
    try {
      const details = await locationApi.get(id)
      setLocationDetails(details)
    } catch (err) {
      setToast({ type: 'error', message: `Không thể tải chi tiết sơ đồ: ${err.message}` })
    } finally {
      setIsDetailsLoading(false)
    }
  }

  // Load all employees and assets for pinning list when in edit-pins mode
  async function loadPinningOptions() {
    try {
      const [empData, assetData] = await Promise.all([
        employeeApi.list(),
        assetApi.list()
      ])
      setEmployees(empData)
      // Filter for assets that can be fixed (or we can show all assets)
      // Standard fixed assets categories: Wifi, Printer, Projector, Screen, Server, etc.
      // We will show all assets, but can display category name next to them
      setAssets(assetData)
    } catch (err) {
      setToast({ type: 'error', message: `Lỗi tải danh mục ghim: ${err.message}` })
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (mode === 'edit-pins') {
        loadPinningOptions()
      } else {
        setSelectedItemToPin(null)
        setTempCoords(null)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [mode])

  const handleLocationSelect = async (loc) => {
    setSelectedLocation(loc)
    setMode('view')
    await loadLocationDetails(loc.id)
  }

  // Filter locations
  const filteredLocations = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return locations
    return locations.filter((loc) =>
      `${loc.name} ${loc.description || ''}`.toLowerCase().includes(keyword)
    )
  }, [locations, search])

  // Filter employees & assets for pinning list
  const filteredEmployeesForPin = useMemo(() => {
    const keyword = pinSearch.trim().toLowerCase()
    return employees.filter((emp) => {
      const matchesSearch = `${emp.fullName} ${emp.employeeCode} ${emp.department?.name || ''}`.toLowerCase().includes(keyword)
      return matchesSearch
    })
  }, [employees, pinSearch])

  const filteredAssetsForPin = useMemo(() => {
    const keyword = pinSearch.trim().toLowerCase()
    return assets.filter((asset) => {
      const matchesSearch = `${asset.name} ${asset.assetCode} ${asset.category?.name || ''}`.toLowerCase().includes(keyword)
      return matchesSearch
    })
  }, [assets, pinSearch])

  // CRUD actions
  function openCreateModal() {
    setEditingLocation({ id: null })
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(loc, event) {
    event.stopPropagation()
    setEditingLocation(loc)
    setForm({ name: loc.name, description: loc.description || '', floorPlanUrl: loc.floorPlanUrl })
    setFormErrors({})
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingLocation(null)
      setForm(EMPTY_FORM)
      setFormErrors({})
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validateForm() {
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Tên sơ đồ cần ít nhất 2 ký tự.'
    if (!form.floorPlanUrl.trim()) nextErrors.floorPlanUrl = 'Đường dẫn ảnh sơ đồ không được để trống.'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        floorPlanUrl: form.floorPlanUrl.trim(),
      }

      if (editingLocation.id) {
        await locationApi.update(editingLocation.id, payload)
        setToast({ type: 'success', message: 'Cập nhật sơ đồ mặt bằng thành công.' })
      } else {
        const created = await locationApi.create(payload)
        setToast({ type: 'success', message: 'Thêm sơ đồ mặt bằng thành công.' })
        setSelectedLocation(created)
      }

      setEditingLocation(null)
      setForm(EMPTY_FORM)
      setFormErrors({})
      await loadLocations()
    } catch (requestError) {
      if (requestError.errorCode === 'VALIDATION_ERROR') {
        setFormErrors({ name: requestError.message })
      } else {
        setToast({ type: 'error', message: requestError.message })
      }
    } finally {
      setIsSaving(false)
    }
  }

  function openDeleteDialog(loc, event) {
    event.stopPropagation()
    setDeletingLocation(loc)
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await locationApi.remove(deletingLocation.id)
      setToast({ type: 'success', message: 'Xóa sơ đồ mặt bằng thành công.' })
      setDeletingLocation(null)
      setSelectedLocation(null)
      setLocationDetails(null)
      await loadLocations()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsDeleting(false)
    }
  }

  // Clicking on map to place pin
  const handleMapClick = (event) => {
    if (mode !== 'edit-pins' || !selectedItemToPin) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setTempCoords({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
  }

  // Save pin position
  async function handleSavePin() {
    if (!selectedItemToPin || !tempCoords) return

    try {
      const { type, item } = selectedItemToPin
      const payload = {
        locationId: selectedLocation.id,
      }

      if (type === 'employee') {
        payload.deskX = tempCoords.x
        payload.deskY = tempCoords.y
        await employeeApi.update(item.id, payload)
        setToast({ type: 'success', message: `Đã ghim vị trí bàn làm việc của ${item.fullName}.` })
      } else {
        payload.locationX = tempCoords.x
        payload.locationY = tempCoords.y
        await assetApi.update(item.id, payload)
        setToast({ type: 'success', message: `Đã ghim vị trí thiết bị ${item.name}.` })
      }

      // Reset
      setTempCoords(null)
      setSelectedItemToPin(null)
      
      // Reload details and list
      await loadLocationDetails(selectedLocation.id)
      await loadPinningOptions()
    } catch (err) {
      setToast({ type: 'error', message: `Lỗi ghim vị trí: ${err.message}` })
    }
  }

  // Remove pin
  async function handleRemovePin(type, item, event) {
    if (event) event.stopPropagation()
    try {
      const payload = {
        locationId: null,
      }

      if (type === 'employee') {
        payload.deskX = null
        payload.deskY = null
        await employeeApi.update(item.id, payload)
        setToast({ type: 'success', message: `Đã gỡ bàn làm việc của nhân viên khỏi sơ đồ.` })
      } else {
        payload.locationX = null
        payload.locationY = null
        await assetApi.update(item.id, payload)
        setToast({ type: 'success', message: `Đã gỡ thiết bị khỏi sơ đồ.` })
      }

      // Reload
      await loadLocationDetails(selectedLocation.id)
      if (mode === 'edit-pins') {
        await loadPinningOptions()
      }
    } catch (err) {
      setToast({ type: 'error', message: `Lỗi gỡ pin: ${err.message}` })
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Left Side: Floor Plan list */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Sơ đồ mặt bằng</h2>
              <button
                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                type="button"
                onClick={openCreateModal}
              >
                <Plus size={14} />
                Thêm sơ đồ
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                placeholder="Tìm sơ đồ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex flex-col gap-2 py-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400">Không tìm thấy sơ đồ nào.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const isActive = selectedLocation?.id === loc.id
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc)}
                      className={`group flex items-center justify-between cursor-pointer rounded-xl border p-3 transition ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold truncate">{loc.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {loc.description || 'Chưa có mô tả'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded"
                          type="button"
                          title="Sửa"
                          onClick={(e) => openEditModal(loc, e)}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded"
                          type="button"
                          title="Xóa"
                          onClick={(e) => openDeleteDialog(loc, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Edit Pins Panel when in edit mode */}
          {mode === 'edit-pins' && selectedLocation && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm animate-fade-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="text-xs font-bold text-slate-800">Cấu hình ghim vị trí</h3>
                <button
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  type="button"
                  onClick={() => setMode('view')}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 mb-3">
                <button
                  className={`rounded-md py-1.5 text-[10px] font-bold transition ${
                    activeTab === 'employees' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => {
                    setActiveTab('employees')
                    setSelectedItemToPin(null)
                    setTempCoords(null)
                  }}
                >
                  Nhân viên ({employees.length})
                </button>
                <button
                  className={`rounded-md py-1.5 text-[10px] font-bold transition ${
                    activeTab === 'assets' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => {
                    setActiveTab('assets')
                    setSelectedItemToPin(null)
                    setTempCoords(null)
                  }}
                >
                  Thiết bị cố định ({assets.filter(a => a.status !== 'ASSIGNED').length})
                </button>
              </div>

              {/* Pinning List Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                <input
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[11px] focus:border-emerald-500 focus:bg-white focus:outline-none"
                  placeholder={activeTab === 'employees' ? 'Tìm nhân viên...' : 'Tìm thiết bị...'}
                  value={pinSearch}
                  onChange={(e) => setPinSearch(e.target.value)}
                />
              </div>

              {/* List items to pin */}
              <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1 text-[11px]">
                {activeTab === 'employees' ? (
                  filteredEmployeesForPin.map((emp) => {
                    const isPinnedOnCurrent = emp.locationId === selectedLocation.id && emp.deskX !== null
                    const isPinnedElsewhere = emp.locationId && emp.locationId !== selectedLocation.id
                    const isSelected = selectedItemToPin?.type === 'employee' && selectedItemToPin?.item.id === emp.id

                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSelectedItemToPin({ type: 'employee', item: emp })
                          setTempCoords(emp.locationId === selectedLocation.id ? { x: emp.deskX, y: emp.deskY } : null)
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{emp.fullName}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">{emp.employeeCode} • {emp.department?.name || 'Không phòng ban'}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isPinnedOnCurrent ? (
                            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-medium text-[9px]" title="Đang ở sơ đồ này">
                              <CheckCircle size={10} /> Đã ghim
                            </span>
                          ) : isPinnedElsewhere ? (
                            <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[9px]" title={`Ghim ở ${emp.location?.name}`}>
                              Sơ đồ khác
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-100 px-1 py-0.5 rounded text-[9px]">
                              Chưa ghim
                            </span>
                          )}

                          {isPinnedOnCurrent && (
                            <button
                              onClick={(e) => handleRemovePin('employee', emp, e)}
                              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded text-slate-400"
                              title="Gỡ ghim"
                            >
                              <XCircle size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  filteredAssetsForPin.map((asset) => {
                    const isPinnedOnCurrent = asset.locationId === selectedLocation.id && asset.locationX !== null
                    const isPinnedElsewhere = asset.locationId && asset.locationId !== selectedLocation.id
                    const isSelected = selectedItemToPin?.type === 'asset' && selectedItemToPin?.item.id === asset.id

                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          setSelectedItemToPin({ type: 'asset', item: asset })
                          setTempCoords(asset.locationId === selectedLocation.id ? { x: asset.locationX, y: asset.locationY } : null)
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-50/60 text-orange-950 border border-orange-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{asset.name}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">
                            {asset.assetCode} • {asset.category?.name || 'Danh mục khác'}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {isPinnedOnCurrent ? (
                            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-medium text-[9px]">
                              <CheckCircle size={10} /> Đã ghim
                            </span>
                          ) : isPinnedElsewhere ? (
                            <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[9px]">
                              Sơ đồ khác
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-100 px-1 py-0.5 rounded text-[9px]">
                              Chưa ghim
                            </span>
                          )}

                          {isPinnedOnCurrent && (
                            <button
                              onClick={(e) => handleRemovePin('asset', asset, e)}
                              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded text-slate-400"
                              title="Gỡ ghim"
                            >
                              <XCircle size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              {/* Pin instructions */}
              {selectedItemToPin && (
                <div className="mt-3 rounded-lg bg-blue-50/65 p-2 text-[10px] text-blue-900 border border-blue-100">
                  <p className="font-bold">Đang cấu hình ghim:</p>
                  <p className="mt-0.5">
                    {selectedItemToPin.type === 'employee' ? 'Nhân viên' : 'Thiết bị'}:{' '}
                    <strong className="text-blue-950">{selectedItemToPin.item.fullName || selectedItemToPin.item.name}</strong>
                  </p>
                  <p className="mt-1 text-slate-500">
                    💡 Click trực tiếp lên ảnh sơ đồ bên phải để đặt chấm ghim, sau đó nhấn nút "Lưu ghim".
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Office Map Workspace */}
        <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm min-h-[500px] flex flex-col">
          {isDetailsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="size-8 animate-spin-soft rounded-full border-3 border-emerald-100 border-t-emerald-600" />
              <p className="text-xs text-slate-400 mt-3 font-semibold">Đang tải bản đồ tương tác...</p>
            </div>
          ) : !selectedLocation ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <MapPin size={48} className="text-slate-300 stroke-[1.2]" />
              <h3 className="text-sm font-bold text-slate-700 mt-4">Chưa có sơ đồ văn phòng nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5">
                Vui lòng tạo sơ đồ văn phòng và tải lên hình ảnh sơ đồ mặt bằng (Floor Plan) để bắt đầu sử dụng bản đồ tương tác định vị thiết bị.
              </p>
              <Button className="mt-4" type="button" onClick={openCreateModal}>
                <Plus size={16} />
                Thêm sơ đồ ngay
              </Button>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{selectedLocation.name}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedLocation.description || 'Không có mô tả'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      mode === 'view'
                        ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                    onClick={() => setMode('view')}
                  >
                    <Eye size={14} />
                    Xem bản đồ
                  </button>
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      mode === 'edit-pins'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                    onClick={() => setMode('edit-pins')}
                  >
                    <Settings size={14} />
                    Ghim vị trí
                  </button>
                </div>
              </div>

              {/* Map Layout view & pins */}
              <div className="flex-1 flex flex-col mt-4">
                {/* Legends */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2.5 bg-blue-500"></span>
                    </span>
                    <span>Bàn làm việc (Employee Desk)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-orange-500 inline-block"></span>
                    <span>Thiết bị cố định (Wifi, Máy in)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2.5 bg-purple-500"></span>
                    </span>
                    <span>Thiết bị di động (resolved)</span>
                  </div>
                </div>

                {/* Actual image canvas container */}
                <div className="relative border border-slate-100 rounded-2xl overflow-hidden bg-slate-100 max-h-[550px] flex items-center justify-center">
                  <div 
                    className="relative cursor-default select-none"
                    onClick={handleMapClick}
                  >
                    <img
                      src={selectedLocation.floorPlanUrl}
                      alt={selectedLocation.name}
                      className="max-w-full max-h-[500px] object-contain block"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
                      }}
                    />

                    {/* Rendering Pinned Employees (Desk Pins) */}
                    {mode === 'view' && locationDetails?.employees?.filter(emp => emp.deskX !== null).map((emp) => {
                      // Check if employee has active assignments (like Laptops)
                      const activeLaptops = emp.assignments?.map(a => a.asset) || []
                      const hasLaptops = activeLaptops.length > 0
                      
                      return (
                        <div
                          key={emp.id}
                          style={{ left: `${emp.deskX}%`, top: `${emp.deskY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                        >
                          {/* Pulsing indicator */}
                          <span className="relative flex size-4.5 cursor-pointer">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              hasLaptops ? 'bg-purple-400' : 'bg-blue-400'
                            }`}></span>
                            <span className={`relative inline-flex rounded-full size-4.5 items-center justify-center text-[8px] font-bold text-white shadow-md ${
                              hasLaptops ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                              {hasLaptops ? '💻' : '👤'}
                            </span>
                          </span>

                          {/* Hover Tooltip (Premium Glassmorphism Detail) */}
                          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-56 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-white backdrop-blur-md shadow-xl text-left text-xs z-50 animate-fade-in">
                            <p className="font-bold text-blue-300">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">MSNV: {emp.employeeCode}</p>
                            
                            {hasLaptops ? (
                              <div className="mt-2 border-t border-slate-700/80 pt-1.5">
                                <p className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                                  <span>💻</span> Thiết bị di động sở hữu:
                                </p>
                                <ul className="mt-1 space-y-1 pl-1">
                                  {activeLaptops.map(asset => (
                                    <li key={asset.id} className="text-[9px] text-slate-200 bg-slate-800/80 px-1.5 py-0.5 rounded flex justify-between items-center">
                                      <span className="font-medium truncate max-w-[120px]">{asset.name}</span>
                                      <span className="text-[8px] text-emerald-400 font-bold">{asset.assetCode}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="mt-1 text-[9px] text-slate-400 italic">Chưa bàn giao thiết bị di động</p>
                            )}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/90"></div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Rendering Pinned Fixed Assets */}
                    {mode === 'view' && locationDetails?.assets?.filter(asset => asset.locationX !== null).map((asset) => {
                      return (
                        <div
                          key={asset.id}
                          style={{ left: `${asset.locationX}%`, top: `${asset.locationY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                        >
                          <span className="relative flex size-4 cursor-pointer">
                            <span className="inline-flex rounded-full size-4 items-center justify-center bg-orange-500 text-[8px] font-bold text-white shadow-md hover:scale-110 transition">
                              🖨️
                            </span>
                          </span>

                          {/* Hover Tooltip */}
                          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-52 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-white backdrop-blur-md shadow-xl text-left text-xs z-50 animate-fade-in">
                            <p className="font-bold text-orange-400">{asset.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mã TS: {asset.assetCode}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Danh mục: {asset.category?.name || 'Cố định'}</p>
                            <div className="mt-1.5 flex justify-between items-center">
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1 py-0.5 rounded">
                                {asset.status}
                              </span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900/90"></div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Editor Mode: Temp Coordinate placement pin */}
                    {mode === 'edit-pins' && tempCoords && (
                      <div
                        style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                      >
                        <span className="flex size-6 animate-pulse items-center justify-center rounded-full bg-red-600 border border-white text-white text-[9px] font-bold shadow-lg">
                          📍
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor Footer Panel */}
                {mode === 'edit-pins' && (
                  <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between animate-fade-up">
                    <div className="text-[11px] text-slate-600">
                      {selectedItemToPin ? (
                        tempCoords ? (
                          <p>
                            🎯 Tọa độ mới:{' '}
                            <strong className="text-slate-800">
                              X: {tempCoords.x}%, Y: {tempCoords.y}%
                            </strong>
                            . Sẵn sàng ghim cho{' '}
                            <strong>{selectedItemToPin.item.fullName || selectedItemToPin.item.name}</strong>.
                          </p>
                        ) : (
                          <p>👉 Vui lòng click lên ảnh sơ đồ để chọn tọa độ cho <strong>{selectedItemToPin.item.fullName || selectedItemToPin.item.name}</strong>.</p>
                        )
                      ) : (
                        <p>💡 Chọn một nhân viên hoặc thiết bị từ danh sách bên trái để bắt đầu ghim vị trí.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!selectedItemToPin}
                        onClick={() => {
                          setSelectedItemToPin(null)
                          setTempCoords(null)
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!tempCoords || !selectedItemToPin}
                        onClick={handleSavePin}
                      >
                        <Save size={14} />
                        Lưu ghim vị trí
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Locations CRUD Form Modal */}
      {editingLocation && (
        <Modal
          title={editingLocation.id ? 'Cập nhật sơ đồ mặt bằng' : 'Thêm sơ đồ mặt bằng'}
          description="Tải lên ảnh sơ đồ tầng văn phòng để ghim các máy in, thiết bị cố định và bàn làm việc."
          onClose={closeFormModal}
        >
          <form className="grid gap-5" noValidate onSubmit={handleSave}>
            <FormField
              label="Tên sơ đồ văn phòng"
              name="name"
              value={form.name}
              error={formErrors.name}
              placeholder="VD: Văn phòng Tầng 5 - Khu Kỹ thuật"
              maxLength={100}
              autoFocus
              onChange={updateField}
            />
            
            <FormField
              label="Đường dẫn ảnh sơ đồ mặt bằng (URL)"
              name="floorPlanUrl"
              value={form.floorPlanUrl}
              error={formErrors.floorPlanUrl}
              placeholder="VD: /uploads/floorplans/floor5.png hoặc đường dẫn ảnh online"
              maxLength={1000}
              onChange={updateField}
              hint="Có thể sử dụng ảnh online hoặc file ảnh nằm trong thư mục web công khai."
            />

            <FormField
              as="textarea"
              label="Mô tả"
              name="description"
              value={form.description}
              error={formErrors.description}
              hint={`${form.description.length}/500`}
              placeholder="Mô tả các phòng hoặc bộ phận làm việc tại tầng này"
              maxLength={500}
              onChange={updateField}
            />
            
            <div className="form-actions">
              <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                {editingLocation.id ? 'Lưu thay đổi' : 'Thêm sơ đồ'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingLocation && (
        <ConfirmDialog
          title={`Xóa sơ đồ "${deletingLocation.name}"?`}
          message="Nếu xóa sơ đồ này, tất cả các tọa độ bàn làm việc nhân viên và vị trí thiết bị ghim trên sơ đồ này sẽ bị xóa. Hành động này không thể hoàn tác."
          confirmLabel="Xóa sơ đồ"
          isSubmitting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => !isDeleting && setDeletingLocation(null)}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
