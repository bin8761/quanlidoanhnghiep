import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import PageHeader from '../../components/ui/PageHeader'

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
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-12 pl-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
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
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setServerError('')
  }

  function validate() {
    const next = {}
    if (!form.currentPassword) next.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      next.newPassword = 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ và số.'
    }
    if (form.newPassword === form.currentPassword) {
      next.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại.'
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
      const { changePassword } = await import('../../services/auth.service')
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setIsSuccess(true)
      setForm(INITIAL_FORM)
    } catch (err) {
      const messages = {
        AUTH_WRONG_PASSWORD: 'Mật khẩu hiện tại không đúng.',
      }
      setServerError(messages[err?.errorCode] || err?.message || 'Đổi mật khẩu thất bại, thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Bảo mật tài khoản"
        title="Đổi mật khẩu"
        description="Cập nhật mật khẩu đăng nhập. Đảm bảo mật khẩu mới đủ mạnh và bảo mật."
      />

      <div className="mx-auto max-w-lg">
        <section className="surface overflow-hidden">
          <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Bảo mật tài khoản</h3>
              <p className="text-[11px] text-slate-500">Mật khẩu được mã hóa và lưu trữ an toàn.</p>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            {isSuccess ? (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={28} />
                  </span>
                  <h4 className="text-base font-extrabold text-slate-950">Đổi mật khẩu thành công</h4>
                  <p className="mt-1.5 text-sm text-slate-500">Lần đăng nhập tiếp theo hãy dùng mật khẩu mới.</p>
                  <button
                    className="mt-5 text-sm font-bold text-brand-700 hover:text-brand-800"
                    type="button"
                    onClick={() => setIsSuccess(false)}
                  >
                    Đổi lại mật khẩu
                  </button>
                </div>
              </div>
            ) : (
              <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
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

                <div className="border-t border-slate-100 pt-5">
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
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                  </div>
                )}

                <Button className="mt-1 w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </form>
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-slate-500">
          Nếu quên mật khẩu hiện tại, hãy liên hệ quản trị viên để được hỗ trợ.
        </p>
      </div>
    </div>
  )
}
