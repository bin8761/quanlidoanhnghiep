import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'

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
    email: 'admin@company.local',
    password: 'Admin123',
  })

  function updateField(event) {
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
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[minmax(420px,44%)_1fr]">
      <section className="relative z-10 flex min-h-screen flex-col justify-center overflow-hidden bg-[#f8fbf9] px-5 py-8 sm:px-10 lg:px-[clamp(48px,6vw,96px)]">
        <div className="pointer-events-none absolute -top-32 -left-32 size-80 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[470px] animate-fade-up">
          <div className="mb-12 flex items-center gap-3 sm:mb-16">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/20">
              <ShieldCheck size={23} />
            </span>
            <span>
              <strong className="block text-sm font-extrabold text-slate-900">
                EAM Workspace
              </strong>
              <span className="text-xs text-slate-500">Enterprise Asset Management</span>
            </span>
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
              placeholder="admin@company.local"
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

            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                role="alert"
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
    </main>
  )
}
