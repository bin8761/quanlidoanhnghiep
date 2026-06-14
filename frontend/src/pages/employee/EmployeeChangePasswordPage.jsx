import { Eye, EyeOff, KeyRound, ShieldCheck, Mail, RefreshCw, Check, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { useAuth } from '../../auth/auth-context'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { toast } from 'react-toastify'
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from '../../services/auth.service'

const INITIAL_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

function PasswordInput({ id, name, value, placeholder, autoComplete, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <KeyRound
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
        size={17}
      />
      <input
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-12 pl-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-emerald-500"
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={onChange}
        required
      />
      <button
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        type="button"
        title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

export default function EmployeeChangePasswordPage() {
  const { user, updateCurrentUser } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('password') // 'password' | 'otp'
  
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setInterval(() => {
        setCooldown((current) => current - 1)
      }, 1000)
      return () => clearInterval(timerId)
    }
  }, [cooldown])

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setServerError('')
  }

  async function handleSendOtp() {
    setServerError('')
    setIsSubmitting(true)
    try {
      await sendForgotPasswordOtp({ email: user?.email })
      toast.success('Mã OTP đã được gửi về email của bạn.')
      setOtpSent(true)
      setCooldown(60)
    } catch (err) {
      setServerError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function validate() {
    const next = {}
    
    if (activeTab === 'password') {
      if (!form.currentPassword) next.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
      if (form.newPassword === form.currentPassword) {
        next.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại.'
      }
    } else {
      if (!form.otp) next.otp = 'Vui lòng nhập mã xác thực OTP.'
      else if (!/^\d{6}$/.test(form.otp)) next.otp = 'Mã OTP phải gồm 6 chữ số.'
    }

    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      next.newPassword = 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ và số.'
    }
    if (form.newPassword !== form.confirmPassword) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }
    
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setServerError('')

    try {
      if (activeTab === 'password') {
        await apiClient.put('/auth/change-password', {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmPassword,
        })
      } else {
        await resetPassword({
          email: user?.email,
          otp: form.otp,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmPassword,
        })
      }
      
      updateCurrentUser({ mustChangePassword: false })
      setIsSuccess(true)
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: '',
      })
      setOtpSent(false)
      setCooldown(0)
    } catch (err) {
      const messages = {
        AUTH_WRONG_PASSWORD: 'Mật khẩu hiện tại không đúng.',
        INVALID_OTP: 'Mã OTP không đúng hoặc đã hết hạn.',
      }
      setServerError(messages[err?.errorCode] || err?.message || 'Thao tác thất bại, thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="employee-change-password-page animate-fade-up">
      <PageHeader
        eyebrow="Bảo mật tài khoản"
        title="Đổi mật khẩu"
        description="Cập nhật mật khẩu đăng nhập. Đảm bảo mật khẩu mới đủ mạnh và bảo mật."
      />

      <div className="mx-auto max-w-lg">
        <section className="surface overflow-hidden">
          {/* TAB BAR HEADER */}
          <div className="flex border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/35">
            <button
              type="button"
              className={`flex-1 py-4 text-center text-xs font-bold transition focus:outline-none cursor-pointer ${
                activeTab === 'password'
                  ? 'border-b-2 border-brand-600 text-brand-700 bg-white dark:bg-[#14201b] dark:text-emerald-300 dark:border-emerald-500'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              onClick={() => {
                setActiveTab('password')
                setServerError('')
                setErrors({})
              }}
            >
              Mật khẩu cũ
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-center text-xs font-bold transition focus:outline-none cursor-pointer ${
                activeTab === 'otp'
                  ? 'border-b-2 border-brand-600 text-brand-700 bg-white dark:bg-[#14201b] dark:text-emerald-300 dark:border-emerald-500'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              onClick={() => {
                setActiveTab('otp')
                setServerError('')
                setErrors({})
              }}
            >
              Xác thực OTP Email
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {isSuccess ? (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck size={28} />
                  </span>
                  <h4 className="text-base font-extrabold text-slate-950 dark:text-slate-50">Cập nhật mật khẩu thành công</h4>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Lần đăng nhập tiếp theo hãy dùng mật khẩu mới.</p>
                  <button
                    className="mt-5 text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                    type="button"
                    onClick={() => setIsSuccess(false)}
                  >
                    Đổi lại mật khẩu
                  </button>
                </div>
              </div>
            ) : (
              <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
                
                {/* CONDITIONAL RENDER FIRST FIELD */}
                {activeTab === 'password' ? (
                  <FormField
                    label="Mật khẩu hiện tại"
                    name="currentPassword"
                    error={errors.currentPassword}
                  >
                    <PasswordInput
                      id="currentPassword"
                      name="currentPassword"
                      value={form.currentPassword}
                      placeholder="Nhập mật khẩu đang dùng"
                      autoComplete="current-password"
                      onChange={updateField}
                    />
                  </FormField>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                      <FormField
                        label="Email nhận OTP (Email đã đăng nhập)"
                        name="email"
                      >
                        <input
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-500 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-900/35"
                          id="email"
                          name="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                        />
                      </FormField>
                      <Button
                        type="button"
                        className="min-h-12 px-5 cursor-pointer"
                        onClick={handleSendOtp}
                        disabled={cooldown > 0 || isSubmitting}
                      >
                        <Mail size={16} />
                        {cooldown > 0 ? `${cooldown}s` : otpSent ? 'Gửi lại mã' : 'Gửi mã'}
                      </Button>
                    </div>

                    <FormField
                      label="Mã xác thực (OTP)"
                      name="otp"
                      error={errors.otp}
                    >
                      <input
                        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100 dark:focus:border-emerald-500"
                        id="otp"
                        name="otp"
                        type="text"
                        value={form.otp}
                        placeholder="Nhập 6 chữ số OTP từ Email"
                        maxLength={6}
                        onChange={updateField}
                      />
                    </FormField>
                  </div>
                )}

                {/* COMMON FIELDS */}
                <div className="border-t border-slate-100 pt-5 dark:border-slate-700">
                  <FormField
                    label="Mật khẩu mới"
                    name="newPassword"
                    error={errors.newPassword}
                    hint="Ít nhất 8 ký tự, gồm chữ và số"
                  >
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      value={form.newPassword}
                      placeholder="Nhập mật khẩu mới"
                      autoComplete="new-password"
                      onChange={updateField}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  error={errors.confirmPassword}
                >
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    onChange={updateField}
                  />
                </FormField>

                {serverError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {serverError}
                  </div>
                )}

                <Button className="mt-1 w-full cursor-pointer" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
