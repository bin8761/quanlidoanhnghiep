import { useEffect, useState } from 'react'
import {
  KeyRound,
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  UserRound,
  User,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  History,
  Plus,
  Trash2,
  Lock,
  UploadCloud,
  FileCheck,
  Download,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../auth/auth-context'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import Toast from '../../components/ui/Toast'
import VietnamAddressSelector from '../../components/ui/VietnamAddressSelector'
import SearchableSelect from '../../components/ui/SearchableSelect'
import AvatarUpload from '../../components/ui/AvatarUpload'
import { VIETNAMESE_ETHNICITIES, NATIONALITIES } from '../../data/vietnam-static'
import useAutoDismiss from '../../hooks/useAutoDismiss'
import { employeeApi } from '../../api/employees'
import { Link } from 'react-router-dom'

const FIELD_LABELS = {
  fullName: 'Họ và tên',
  avatarUrl: 'Ảnh đại diện',
  phone: 'Số điện thoại',
  personalEmail: 'Email cá nhân',
  dateOfBirth: 'Ngày sinh',
  gender: 'Giới tính',
  permanentAddress: 'Địa chỉ thường trú',
  currentAddress: 'Địa chỉ hiện tại',
  emergencyContact: 'Liên hệ khẩn cấp',
  education: 'Trình độ học vấn',
  skills: 'Kỹ năng',
  certificates: 'Chứng chỉ',
  hometown: 'Quê quán',
  ethnicity: 'Dân tộc',
  nationality: 'Quốc tịch',
  identityCardNumber: 'Số CCCD',
  allowProfileUpdate: 'Quyền tự cập nhật hồ sơ',
  position: 'Chức vụ',
  status: 'Trạng thái nhân viên',
  departmentId: 'Phòng ban',
  joinDate: 'Ngày vào làm'
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
  } catch {
    return 'Chưa cập nhật'
  }
}

function toInputDateString(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export default function EmployeeProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('job')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Edit Forms
  const [personalForm, setPersonalForm] = useState({
    avatarUrl: '',
    fullName: '',
    phone: '',
    personalEmail: '',
    dateOfBirth: '',
    gender: '',
    hometown: '',
    ethnicity: '',
    nationality: '',
    identityCardNumber: '',
    permanentAddress: '',
    currentAddress: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: ''
  })

  const [resumeForm, setResumeForm] = useState({
    education: [],
    skills: '',
    certificates: ''
  })

  // Attachment Form
  const [attachForm, setAttachForm] = useState({
    fileName: '',
    fileType: 'CV',
    fileUrl: '',
    fileSize: '0 KB'
  })
  const [isUploading, setIsUploading] = useState(false)

  useAutoDismiss(toast, setToast)

  const loadProfileData = async () => {
    if (!user?.employeeId) {
      setError('Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const empData = await employeeApi.getById(user.employeeId)
      setProfile(empData)

      // Personal form init
      const emergency = empData.emergencyContact || {}
      setPersonalForm({
        avatarUrl: empData.avatarUrl || '',
        fullName: empData.fullName || '',
        phone: empData.phone || '',
        personalEmail: empData.personalEmail || '',
        dateOfBirth: toInputDateString(empData.dateOfBirth),
        gender: empData.gender || 'Nam',
        hometown: empData.hometown || '',
        ethnicity: empData.ethnicity || '',
        nationality: empData.nationality || '',
        identityCardNumber: empData.identityCardNumber || '',
        permanentAddress: empData.permanentAddress || '',
        currentAddress: empData.currentAddress || '',
        emergencyName: emergency.name || '',
        emergencyPhone: emergency.phone || '',
        emergencyRelation: emergency.relation || ''
      })

      // Resume form init
      setResumeForm({
        education: Array.isArray(empData.education) ? empData.education : [],
        skills: Array.isArray(empData.skills) ? empData.skills.join(', ') : '',
        certificates: Array.isArray(empData.certificates) ? empData.certificates.join(', ') : ''
      })

      // Attachments & Logs
      const [attachList, logList] = await Promise.all([
        employeeApi.getAttachments(user.employeeId),
        employeeApi.getLogs(user.employeeId)
      ])
      setAttachments(attachList)
      setLogs(logList)
    } catch (err) {
      setError(err.message || 'Lỗi tải thông tin hồ sơ nhân viên.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [user])

  // Update Personal Info
  const handlePersonalSubmit = async (e) => {
    e.preventDefault()
    if (!profile.allowProfileUpdate) {
      setToast({ type: 'error', message: 'Quyền cập nhật thông tin của bạn đã bị khóa.' })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        avatarUrl: personalForm.avatarUrl || null,
        fullName: personalForm.fullName.trim(),
        phone: personalForm.phone.trim() || null,
        personalEmail: personalForm.personalEmail.trim() || null,
        dateOfBirth: personalForm.dateOfBirth ? new Date(personalForm.dateOfBirth) : null,
        gender: personalForm.gender || null,
        hometown: personalForm.hometown.trim() || null,
        ethnicity: personalForm.ethnicity.trim() || null,
        nationality: personalForm.nationality.trim() || null,
        identityCardNumber: personalForm.identityCardNumber.trim() || null,
        permanentAddress: personalForm.permanentAddress.trim() || null,
        currentAddress: personalForm.currentAddress.trim() || null,
        emergencyContact: {
          name: personalForm.emergencyName.trim() || null,
          phone: personalForm.emergencyPhone.trim() || null,
          relation: personalForm.emergencyRelation.trim() || null
        }
      }
      await employeeApi.update(profile.id, payload)
      setToast({ type: 'success', message: 'Cập nhật thông tin cá nhân thành công.' })
      
      // Reload logs and data, sync form state
      const updatedEmp = await employeeApi.getById(profile.id)
      setProfile(updatedEmp)
      // Sync avatarUrl back so the header shows the saved avatar
      setPersonalForm(c => ({ ...c, avatarUrl: updatedEmp.avatarUrl || '' }))
      const newLogs = await employeeApi.getLogs(profile.id)
      setLogs(newLogs)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi cập nhật thông tin cá nhân.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Update Resume Info
  const handleResumeSubmit = async (e) => {
    e.preventDefault()
    if (!profile.allowProfileUpdate) {
      setToast({ type: 'error', message: 'Quyền cập nhật thông tin của bạn đã bị khóa.' })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        education: resumeForm.education,
        skills: resumeForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        certificates: resumeForm.certificates.split(',').map(c => c.trim()).filter(Boolean)
      }
      await employeeApi.update(profile.id, payload)
      setToast({ type: 'success', message: 'Cập nhật sơ yếu lý lịch thành công.' })

      // Reload logs and data
      const updatedEmp = await employeeApi.getById(profile.id)
      setProfile(updatedEmp)
      const newLogs = await employeeApi.getLogs(profile.id)
      setLogs(newLogs)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi cập nhật sơ yếu lý lịch.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Education Item Change
  const updateEducationItem = (index, field, value) => {
    const nextEd = [...resumeForm.education]
    nextEd[index] = { ...nextEd[index], [field]: value }
    setResumeForm(current => ({ ...current, education: nextEd }))
  }

  const addEducationItem = () => {
    setResumeForm(current => ({
      ...current,
      education: [...current.education, { school: '', major: '', degree: 'Đại học', graduateYear: new Date().getFullYear() }]
    }))
  }

  const removeEducationItem = (index) => {
    const nextEd = resumeForm.education.filter((_, i) => i !== index)
    setResumeForm(current => ({ ...current, education: nextEd }))
  }

  // Handle Mock File Selector
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Calculate human readable size
      let sizeStr = '0 KB'
      if (file.size > 1024 * 1024) {
        sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      } else {
        sizeStr = (file.size / 1024).toFixed(0) + ' KB'
      }
      setAttachForm({
        fileName: file.name,
        fileType: getFileTypeFromExtension(file.name),
        fileUrl: `/mock-uploads/${Date.now()}_${file.name}`,
        fileSize: sizeStr
      })
    }
  }

  const getFileTypeFromExtension = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['pdf', 'doc', 'docx'].includes(ext)) return 'CV'
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'CCCD'
    return 'OTHER'
  }

  const handleUploadAttachment = async (e) => {
    e.preventDefault()
    if (!attachForm.fileName || !attachForm.fileUrl) {
      setToast({ type: 'error', message: 'Vui lòng chọn một tệp tin trước khi tải lên.' })
      return
    }
    setIsUploading(true)
    try {
      await employeeApi.uploadAttachment(profile.id, {
        fileName: attachForm.fileName,
        fileType: attachForm.fileType,
        fileUrl: attachForm.fileUrl
      })
      setToast({ type: 'success', message: 'Tải lên tài liệu đính kèm thành công.' })
      setAttachForm({ fileName: '', fileType: 'CV', fileUrl: '', fileSize: '0 KB' })

      // Reload attachments
      const attachList = await employeeApi.getAttachments(profile.id)
      setAttachments(attachList)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi tải lên tài liệu đính kèm.' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu đính kèm này?')) return
    try {
      await employeeApi.deleteAttachment(profile.id, attachmentId)
      setToast({ type: 'success', message: 'Xóa tài liệu đính kèm thành công.' })
      // Reload attachments
      const attachList = await employeeApi.getAttachments(profile.id)
      setAttachments(attachList)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi xóa tài liệu đính kèm.' })
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[400px] place-items-center bg-[#f3f7f5]">
        <div className="text-center animate-pulse">
          <div className="mx-auto size-9 rounded-full border-3 border-brand-100 border-t-brand-600 animate-spin" />
          <p className="mt-4 text-xs font-semibold text-slate-500">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
        <h4 className="font-bold">Đã xảy ra lỗi</h4>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Quản lý tài khoản"
        title="Hồ sơ nhân viên"
        description="Quản lý thông tin hồ sơ cá nhân, sơ yếu lý lịch và hồ sơ chứng chỉ đính kèm."
      />

      {/* Lock Banner */}
      {!profile.allowProfileUpdate && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Lock size={18} className="shrink-0 text-amber-600" />
          <div className="text-xs font-semibold">
            Quyền tự cập nhật thông tin cá nhân của bạn đã bị khóa bởi Quản trị viên. Bạn chỉ có thể xem dữ liệu.
          </div>
        </div>
      )}

      {/* Main Profile Widget */}
      <section className="surface overflow-hidden">
        <div className="bg-slate-950 px-5 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="shrink-0">
                <AvatarUpload
                  value={personalForm.avatarUrl || profile.avatarUrl || ''}
                  onChange={val => setPersonalForm(c => ({ ...c, avatarUrl: val }))}
                  name={profile.fullName}
                  size="md"
                  disabled={!profile.allowProfileUpdate}
                  showLabel={false}
                />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">{profile.fullName}</h3>
                <p className="mt-1 text-sm text-white/60">{profile.position || 'Staff'} · {profile.department?.name || 'Chưa phân phòng'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                    {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-blue-300">
                    Mã NV: {profile.employeeCode}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <Link
                to="/employee/change-password"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <KeyRound size={13} />
                Đổi mật khẩu
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6">
          <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {[
              { id: 'job', label: 'Thông tin công việc', icon: Briefcase },
              { id: 'personal', label: 'Thông tin cá nhân', icon: User },
              { id: 'resume', label: 'Sơ yếu lý lịch', icon: GraduationCap },
              { id: 'attachments', label: 'Tài liệu & Đính kèm', icon: FileText },
              { id: 'logs', label: 'Lịch sử cập nhật', icon: History }
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 py-4 text-xs font-bold transition focus:outline-none whitespace-nowrap ${
                    active
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-8">

          {/* TAB 1: Job Info */}
          {activeTab === 'job' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Thông tin nhân sự</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Mã nhân viên</span>
                    <span className="text-sm font-semibold text-slate-800">{profile.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Họ và tên</span>
                    <span className="text-sm font-semibold text-slate-800">{profile.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Email công ty</span>
                    <span className="text-sm font-semibold text-slate-800 break-all">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Trạng thái</span>
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      profile.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border'
                    }`}>
                      {profile.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Vị trí & Tổ chức</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Phòng ban</span>
                    <span className="text-sm font-semibold text-slate-800">{profile.department?.name || 'Chưa phân phòng'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Chức vụ</span>
                    <span className="text-sm font-semibold text-slate-800">{profile.position || 'Staff'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Ngày vào làm</span>
                    <span className="text-sm font-semibold text-slate-800">{formatDate(profile.joinDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Vai trò hệ thống</span>
                    <span className="text-sm font-semibold text-slate-800">{user?.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (User)'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Personal Info */}
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Họ và tên"
                  name="fullName"
                  value={personalForm.fullName}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  required
                  onChange={e => setPersonalForm(c => ({ ...c, fullName: e.target.value }))}
                />
                <FormField
                  label="Số điện thoại"
                  name="phone"
                  value={personalForm.phone}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setPersonalForm(c => ({ ...c, phone: e.target.value }))}
                />
                <FormField
                  label="Email cá nhân"
                  name="personalEmail"
                  type="email"
                  value={personalForm.personalEmail}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setPersonalForm(c => ({ ...c, personalEmail: e.target.value }))}
                />
                <FormField
                  label="Ngày sinh"
                  name="dateOfBirth"
                  type="date"
                  value={personalForm.dateOfBirth}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setPersonalForm(c => ({ ...c, dateOfBirth: e.target.value }))}
                />
                <FormField
                  as="select"
                  label="Giới tính"
                  name="gender"
                  value={personalForm.gender}
                  options={[
                    { value: 'Nam', label: 'Nam' },
                    { value: 'Nữ', label: 'Nữ' },
                    { value: 'Khác', label: 'Khác' }
                  ]}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setPersonalForm(c => ({ ...c, gender: e.target.value }))}
                />
                <FormField
                  label="Số CCCD"
                  name="identityCardNumber"
                  value={personalForm.identityCardNumber}
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setPersonalForm(c => ({ ...c, identityCardNumber: e.target.value }))}
                />
                {/* Quê quán - chọn tỉnh/thành */}
                <div className="lg:col-span-1">
                  <SearchableSelect
                    label="Quê quán (Tỉnh/Thành phố)"
                    options={[
                      { value: '', label: '-- Chưa chọn --' },
                      ...[
                        'Hà Nội','TP Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ',
                        'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
                        'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước',
                        'Bình Thuận','Cà Mau','Cao Bằng','Đắk Lắk','Đắk Nông',
                        'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang',
                        'Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình',
                        'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu',
                        'Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định',
                        'Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên',
                        'Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị',
                        'Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
                        'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang',
                        'Vĩnh Long','Vĩnh Phúc','Yên Bái'
                      ].map(t => ({ value: t, label: t }))
                    ]}
                    value={personalForm.hometown}
                    onChange={val => setPersonalForm(c => ({ ...c, hometown: val }))}
                    placeholder="Chọn tỉnh/thành quê quán"
                    disabled={!profile.allowProfileUpdate || isSaving}
                  />
                </div>
                {/* Dân tộc - dropdown cố định */}
                <SearchableSelect
                  label="Dân tộc"
                  options={[
                    { value: '', label: '-- Chưa chọn --' },
                    ...VIETNAMESE_ETHNICITIES.map(e => ({ value: e, label: e }))
                  ]}
                  value={personalForm.ethnicity}
                  onChange={val => setPersonalForm(c => ({ ...c, ethnicity: val }))}
                  placeholder="Chọn dân tộc"
                  disabled={!profile.allowProfileUpdate || isSaving}
                />
                {/* Quốc tịch - searchable */}
                <SearchableSelect
                  label="Quốc tịch"
                  options={[{ value: '', label: '-- Chưa chọn --' }, ...NATIONALITIES]}
                  value={personalForm.nationality}
                  onChange={val => setPersonalForm(c => ({ ...c, nationality: val }))}
                  placeholder="Tìm và chọn quốc tịch"
                  disabled={!profile.allowProfileUpdate || isSaving}
                />
              </div>

              {/* Địa chỉ thường trú và hiện tại */}
              <div className="grid gap-5 sm:grid-cols-2">
                <VietnamAddressSelector
                  label="Địa chỉ thường trú"
                  value={personalForm.permanentAddress}
                  onChange={val => setPersonalForm(c => ({ ...c, permanentAddress: val }))}
                  includeStreet={true}
                  disabled={!profile.allowProfileUpdate || isSaving}
                />
                <VietnamAddressSelector
                  label="Địa chỉ hiện tại"
                  value={personalForm.currentAddress}
                  onChange={val => setPersonalForm(c => ({ ...c, currentAddress: val }))}
                  includeStreet={true}
                  disabled={!profile.allowProfileUpdate || isSaving}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Người liên hệ khẩn cấp</h4>
                <div className="grid gap-5 sm:grid-cols-3">
                  <FormField
                    label="Họ tên người liên hệ"
                    name="emergencyName"
                    value={personalForm.emergencyName}
                    disabled={!profile.allowProfileUpdate || isSaving}
                    onChange={e => setPersonalForm(c => ({ ...c, emergencyName: e.target.value }))}
                  />
                  <FormField
                    label="Số điện thoại liên hệ"
                    name="emergencyPhone"
                    value={personalForm.emergencyPhone}
                    disabled={!profile.allowProfileUpdate || isSaving}
                    onChange={e => setPersonalForm(c => ({ ...c, emergencyPhone: e.target.value }))}
                  />
                  <FormField
                    label="Mối quan hệ"
                    name="emergencyRelation"
                    value={personalForm.emergencyRelation}
                    disabled={!profile.allowProfileUpdate || isSaving}
                    onChange={e => setPersonalForm(c => ({ ...c, emergencyRelation: e.target.value }))}
                  />
                </div>
              </div>

              {profile.allowProfileUpdate && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* TAB 3: Resume */}
          {activeTab === 'resume' && (
            <form onSubmit={handleResumeSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Học vấn & Trình độ</h4>
                  {profile.allowProfileUpdate && (
                    <Button type="button" variant="secondary" size="sm" onClick={addEducationItem}>
                      <Plus size={14} /> Thêm trình độ
                    </Button>
                  )}
                </div>

                {resumeForm.education.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Chưa cập nhật thông tin học vấn.</p>
                ) : (
                  <div className="space-y-4">
                    {resumeForm.education.map((item, idx) => (
                      <div key={idx} className="relative grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-4 items-end">
                        <FormField
                          label="Trường học"
                          name={`school-${idx}`}
                          value={item.school || ''}
                          disabled={!profile.allowProfileUpdate || isSaving}
                          onChange={e => updateEducationItem(idx, 'school', e.target.value)}
                        />
                        <FormField
                          label="Chuyên ngành"
                          name={`major-${idx}`}
                          value={item.major || ''}
                          disabled={!profile.allowProfileUpdate || isSaving}
                          onChange={e => updateEducationItem(idx, 'major', e.target.value)}
                        />
                        <FormField
                          as="select"
                          label="Bằng cấp"
                          name={`degree-${idx}`}
                          value={item.degree || 'Đại học'}
                          options={[
                            { value: 'Trung cấp', label: 'Trung cấp' },
                            { value: 'Cao đẳng', label: 'Cao đẳng' },
                            { value: 'Đại học', label: 'Đại học' },
                            { value: 'Thạc sĩ', label: 'Thạc sĩ' },
                            { value: 'Tiến sĩ', label: 'Tiến sĩ' },
                            { value: 'Khác', label: 'Khác' }
                          ]}
                          disabled={!profile.allowProfileUpdate || isSaving}
                          onChange={e => updateEducationItem(idx, 'degree', e.target.value)}
                        />
                        <div className="flex gap-2 items-center">
                          <FormField
                            label="Năm tốt nghiệp"
                            name={`graduateYear-${idx}`}
                            type="number"
                            value={item.graduateYear || ''}
                            disabled={!profile.allowProfileUpdate || isSaving}
                            onChange={e => updateEducationItem(idx, 'graduateYear', Number(e.target.value))}
                          />
                          {profile.allowProfileUpdate && (
                            <button
                              type="button"
                              className="mt-6 p-2 rounded-lg text-slate-400 hover:text-red-600 transition hover:bg-red-50"
                              onClick={() => removeEducationItem(idx)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2 border-t pt-4">
                <FormField
                  as="textarea"
                  label="Kỹ năng chuyên môn"
                  name="skills"
                  value={resumeForm.skills}
                  hint="Nhập các kỹ năng, phân cách bằng dấu phẩy (,)"
                  placeholder="VD: Node.js, React, SQL, Project Management"
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setResumeForm(c => ({ ...c, skills: e.target.value }))}
                />
                <FormField
                  as="textarea"
                  label="Chứng chỉ chuyên môn"
                  name="certificates"
                  value={resumeForm.certificates}
                  hint="Nhập các chứng chỉ, phân cách bằng dấu phẩy (,)"
                  placeholder="VD: AWS Certified Cloud Practitioner, PMP, IELTS 7.5"
                  disabled={!profile.allowProfileUpdate || isSaving}
                  onChange={e => setResumeForm(c => ({ ...c, certificates: e.target.value }))}
                />
              </div>

              {profile.allowProfileUpdate && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    Lưu sơ yếu lý lịch
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* TAB 4: Attachments */}
          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Upload Form */}
              {profile.allowProfileUpdate && (
                <form onSubmit={handleUploadAttachment} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tải tài liệu đính kèm</h4>
                  <div className="grid gap-4 sm:grid-cols-3 items-end">
                    <FormField
                      as="select"
                      label="Loại tài liệu"
                      name="fileType"
                      value={attachForm.fileType}
                      options={[
                        { value: 'CV', label: 'CV / Sơ yếu lý lịch' },
                        { value: 'CCCD', label: 'Căn cước công dân' },
                        { value: 'DEGREE', label: 'Bằng cấp tốt nghiệp' },
                        { value: 'CERTIFICATE', label: 'Chứng chỉ chuyên môn' },
                        { value: 'OTHER', label: 'Tài liệu khác' }
                      ]}
                      onChange={e => setAttachForm(c => ({ ...c, fileType: e.target.value }))}
                    />
                    <div className="grid gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Chọn tệp tin</label>
                      <div className="relative flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 cursor-pointer hover:border-slate-400 transition min-h-11">
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          onChange={handleFileChange}
                        />
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <UploadCloud size={16} />
                          {attachForm.fileName ? `${attachForm.fileName} (${attachForm.fileSize})` : 'Chọn tệp PDF, DOCX, JPG...'}
                        </span>
                      </div>
                    </div>
                    <Button type="submit" disabled={isUploading || !attachForm.fileName} className="w-full">
                      {isUploading ? 'Đang gửi...' : 'Đính kèm tài liệu'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Attachments List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Tài liệu đã đính kèm ({attachments.length})</h4>
                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có tài liệu đính kèm nào được tải lên.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attachments.map(file => (
                      <div key={file.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:border-slate-200 transition">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                            <FileCheck size={18} />
                          </span>
                          <div className="min-w-0">
                            <h5 className="truncate text-xs font-bold text-slate-800" title={file.fileName}>{file.fileName}</h5>
                            <span className="mt-0.5 inline-flex rounded bg-slate-50 px-1 text-[9px] font-bold text-slate-500 border">
                              {file.fileType}
                            </span>
                            <span className="ml-2 text-[10px] text-slate-400 block sm:inline">
                              Tải lên: {formatDate(file.uploadedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition"
                            title="Tải xuống tài liệu"
                          >
                            <Download size={15} />
                          </a>
                          {profile.allowProfileUpdate && (
                            <button
                              type="button"
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 transition"
                              onClick={() => handleDeleteAttachment(file.id)}
                              title="Xóa tài liệu"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Nhật ký thay đổi hồ sơ</h4>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có nhật ký thay đổi nào được ghi nhận.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Người thực hiện</th>
                        <th className="p-3">Trường thay đổi</th>
                        <th className="p-3">Giá trị cũ</th>
                        <th className="p-3">Giá trị mới</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {logs.map(log => {
                        let actorName = 'System'
                        if (log.actor) {
                          actorName = log.actor.employee?.fullName || log.actor.email
                        }
                        const fieldLabel = FIELD_LABELS[log.fieldName] || log.fieldName

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 whitespace-nowrap text-slate-400 font-medium">
                              {new Intl.DateTimeFormat('vi-VN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              }).format(new Date(log.changedAt))}
                            </td>
                            <td className="p-3 font-semibold">{actorName}</td>
                            <td className="p-3 font-bold text-brand-700">{fieldLabel}</td>
                            <td className="p-3 break-all max-w-[200px]" title={log.oldValue}>
                              {log.oldValue || <span className="text-slate-400 italic">Trống</span>}
                            </td>
                            <td className="p-3 break-all max-w-[200px]" title={log.newValue}>
                              {log.newValue || <span className="text-slate-400 italic">Trống</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

