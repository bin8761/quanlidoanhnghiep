import { useState, useEffect } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Mail,
  RefreshCw,
  Check,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import Modal from '../components/ui/Modal'
import { toast } from 'react-toastify'
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from '../services/auth.service'

const benefits = [
  'Theo dõi toàn bộ vòng đời tài sản',
  'Quản lý bàn giao và bảo trì tập trung',
  'Báo cáo trạng thái theo thời gian thực',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  function updateField(event) {
    if (error) {
      setError('')
    }
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(form)

      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard')
    } catch (requestError) {
      setError(
        requestError.errorCode === 'AUTH_INVALID_CREDENTIALS'
          ? 'Email hoặc mật khẩu không chính xác.'
          : requestError.message || 'Đăng nhập không thành công. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setInterval(() => {
        setCooldown((current) => current - 1)
      }, 1000)
      return () => clearInterval(timerId)
    }
  }, [cooldown])

  function updateForgotForm(e) {
    if (forgotError) setForgotError('')
    setForgotForm((current) => ({ ...current, [e.target.name]: e.target.value }))
  }

  async function handleRequestOtp(e) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await sendForgotPasswordOtp({ email: forgotForm.email })
      toast.success('Mã OTP đã được gửi về email của bạn.')
      setForgotStep(2)
      setCooldown(60)
    } catch (err) {
      setForgotError(err.message || 'Gửi OTP thất bại. Vui lòng thử lại.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return
    setForgotError('')
    setForgotLoading(true)
    try {
      await sendForgotPasswordOtp({ email: forgotForm.email })
      toast.success('Đã gửi lại mã OTP mới.')
      setCooldown(60)
    } catch (err) {
      setForgotError(err.message || 'Gửi OTP thất bại.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await verifyForgotPasswordOtp({ email: forgotForm.email, otp: forgotForm.otp })
      toast.success('Xác thực OTP thành công!')
      setForgotStep(3)
    } catch (err) {
      setForgotError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setForgotError('')
    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      setForgotError('Mật khẩu xác nhận không khớp.')
      return
    }
    setForgotLoading(true)
    try {
      await resetPassword({
        email: forgotForm.email,
        otp: forgotForm.otp,
        newPassword: forgotForm.newPassword,
        confirmNewPassword: forgotForm.confirmNewPassword,
      })
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.')
      setShowForgotModal(false)
      // Reset state
      setForgotStep(1)
      setForgotForm({ email: '', otp: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      setForgotError(err.message || 'Đặt lại mật khẩu thất bại.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[minmax(420px,44%)_1fr]">
      <section className="relative z-10 flex min-h-screen flex-col justify-center overflow-hidden bg-[#f8fbf9] px-5 py-8 sm:px-10 lg:px-[clamp(48px,6vw,96px)]">
        <div className="relative mx-auto w-full max-w-[470px] animate-fade-up">
          <div className="mb-12 flex items-center sm:mb-16">
            <img
              className="h-14 w-auto max-w-[280px] object-contain drop-shadow-sm sm:h-16"
              src="/brand/eam-logo-wordmark.png"
              alt="EAM Workspace"
            />
          </div>

          <div className="mb-8">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700">
              <Sparkles size={13} />
              Không gian quản trị doanh nghiệp
            </span>
            <h1 className="max-w-md text-3xl leading-tight font-extrabold text-slate-950 sm:text-[40px] sm:leading-[1.12]">
              Chào mừng trở lại
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-[15px]">
              Đăng nhập để quản lý tài sản, bàn giao, bảo trì và báo cáo trong một
              không gian làm việc thống nhất.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <FormField
              label="Email công ty"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              placeholder="Nhập email công ty của bạn"
              required
            />

            <FormField label="Mật khẩu" name="password">
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-12 pl-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  type="button"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>

            <div className="flex justify-end -mt-2">
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition focus:outline-none cursor-pointer"
                onClick={() => {
                  setShowForgotModal(true)
                  setForgotStep(1)
                  setForgotError('')
                }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <div className="mt-1 grid gap-3">
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <ArrowRight size={18} />
                )}
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}
              </Button>
            </div>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <Link
                className="font-bold text-brand-700 transition hover:text-brand-800"
                to="/register"
              >
                Đăng ký bằng mã nhân viên
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="login-visual ambient-grid relative hidden min-h-screen overflow-hidden lg:flex lg:items-end lg:p-12 xl:p-16">
        <div className="relative z-10 max-w-xl rounded-3xl border border-white/15 bg-black/20 p-7 text-white shadow-premium backdrop-blur-xl xl:p-9">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
            <ShieldCheck size={14} />
            Quản trị an toàn và nhất quán
          </span>
          <h2 className="text-3xl leading-tight font-bold xl:text-4xl">
            Kiểm soát toàn diện tài sản doanh nghiệp.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
            Từ cấp phát thiết bị đến bảo trì và kiểm kê, mọi hoạt động đều được tổ
            chức rõ ràng để đội ngũ vận hành hiệu quả hơn.
          </p>
          <div className="mt-7 grid gap-3">
            {benefits.map((benefit) => (
              <div className="flex items-center gap-3 text-sm text-white/90" key={benefit}>
                <CheckCircle2 className="text-emerald-300" size={17} />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showForgotModal && (
        <Modal
          title="Khôi phục mật khẩu"
          description="Hệ thống sẽ gửi mã xác thực (OTP) tới email của bạn để thay đổi mật khẩu."
          onClose={() => setShowForgotModal(false)}
          size="md"
        >
          {/* Stepper Header */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                forgotStep === 1
                  ? 'bg-brand-600 text-white'
                  : forgotStep > 1
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}>
                {forgotStep > 1 ? <Check size={14} /> : '1'}
              </span>
              <span className={`text-xs font-semibold ${forgotStep === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Gửi mã OTP
              </span>
            </div>
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                forgotStep === 2
                  ? 'bg-brand-600 text-white'
                  : forgotStep > 2
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}>
                {forgotStep > 2 ? <Check size={14} /> : '2'}
              </span>
              <span className={`text-xs font-semibold ${forgotStep === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Xác thực OTP
              </span>
            </div>
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                forgotStep === 3
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}>
                3
              </span>
              <span className={`text-xs font-semibold ${forgotStep === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Đổi mật khẩu
              </span>
            </div>
          </div>

          {forgotError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-400">
              {forgotError}
            </div>
          )}

          {forgotStep === 1 && (
            <form onSubmit={handleRequestOtp} className="grid gap-4">
              <FormField
                label="Email công ty đã đăng ký"
                name="email"
                type="email"
                value={forgotForm.email}
                onChange={updateForgotForm}
                placeholder="email@company.local"
                required
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? (
                    <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {forgotLoading ? 'Đang xử lý...' : 'Gửi mã OTP'}
                </Button>
              </div>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mã xác thực đã được gửi đến địa chỉ <strong>{forgotForm.email}</strong>. Vui lòng nhập mã OTP để tiếp tục.
              </p>
              <FormField
                label="Mã xác thực (OTP)"
                name="otp"
                type="text"
                value={forgotForm.otp}
                onChange={updateForgotForm}
                placeholder="Nhập 6 chữ số"
                maxLength={6}
                required
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || forgotLoading}
                  className={`flex items-center gap-1.5 text-xs font-bold transition focus:outline-none ${
                    cooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-brand-700 hover:text-brand-800 cursor-pointer'
                  }`}
                >
                  <RefreshCw size={12} className={forgotLoading ? 'animate-spin' : ''} />
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã OTP'}
                </button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForgotStep(1)}
                    disabled={forgotLoading}
                  >
                    Quay lại
                  </Button>
                  <Button type="submit" disabled={forgotLoading}>
                    {forgotLoading ? (
                      <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    {forgotLoading ? 'Đang xử lý...' : 'Xác nhận mã'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {forgotStep === 3 && (
            <form onSubmit={handleResetPassword} className="grid gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mã OTP đã được xác nhận thành công. Hãy đặt mật khẩu mới của bạn dưới đây.
              </p>
              
              <FormField label="Mật khẩu mới" name="newPassword">
                <input
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={forgotForm.newPassword}
                  onChange={updateForgotForm}
                  placeholder="Mật khẩu ít nhất 8 ký tự (chữ & số)"
                  required
                />
              </FormField>

              <FormField label="Xác nhận mật khẩu mới" name="confirmNewPassword">
                <input
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  value={forgotForm.confirmNewPassword}
                  onChange={updateForgotForm}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </FormField>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? (
                    <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Check size={16} />
                  )}
                  {forgotLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </main>
  )
}
