import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  UserPlus,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'

const INITIAL_FORM = {
  employeeCode: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setServerError('')
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.employeeCode.trim()) {
      nextErrors.employeeCode = 'Vui lòng nhập mã nhân viên.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Email không hợp lệ.'
    }

    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      nextErrors.password = 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.'
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setServerError('')

    try {
      await register({
        employeeCode: form.employeeCode.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      setIsSuccess(true)
      window.setTimeout(() => navigate('/login'), 1400)
    } catch (requestError) {
      const messages = {
        AUTH_USER_ALREADY_EXISTS: 'Nhân viên này đã có tài khoản.',
        AUTH_USER_NOT_FOUND: 'Không tìm thấy mã nhân viên trong hệ thống.',
        AUTH_EMPLOYEE_EMAIL_MISMATCH: 'Email không khớp với hồ sơ nhân viên.',
      }
      setServerError(messages[requestError.errorCode] || requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-[620px] animate-fade-up">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
          to="/login"
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-premium">
          <header className="border-b border-slate-100 bg-slate-950 px-6 py-7 text-white sm:px-8">
            <span className="mb-5 grid size-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-brand-500/20">
              <img
                className="size-10 object-contain"
                src="/brand/eam-logo-icon.png"
                alt="EAM Workspace"
              />
            </span>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Đăng ký tài khoản</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/60">
              Sử dụng mã nhân viên và email công ty đã được lưu trong hệ thống để tạo
              tài khoản truy cập.
            </p>
          </header>

          <div className="p-6 sm:p-8">
            {isSuccess ? (
              <div className="grid min-h-72 place-items-center text-center">
                <div>
                  <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={30} />
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-950">
                    Đăng ký thành công
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Đang chuyển bạn về trang đăng nhập...
                  </p>
                </div>
              </div>
            ) : (
              <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
                <FormField
                  label="Mã nhân viên"
                  name="employeeCode"
                  value={form.employeeCode}
                  error={errors.employeeCode}
                  placeholder="VD: EMP001"
                  autoComplete="off"
                  required
                  onChange={updateField}
                />
                <FormField
                  label="Email công ty"
                  name="email"
                  type="email"
                  value={form.email}
                  error={errors.email}
                  placeholder="name@company.local"
                  autoComplete="email"
                  required
                  onChange={updateField}
                />
                <FormField label="Mật khẩu" name="password" error={errors.password}>
                  <div className="relative">
                    <IdCard
                      className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-12 pl-11 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                      autoComplete="new-password"
                      required
                      onChange={updateField}
                    />
                    <button
                      className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      type="button"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </FormField>
                <FormField
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  required
                  onChange={updateField}
                />

                {serverError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}

                <Button className="mt-1 w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
