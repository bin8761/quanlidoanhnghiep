import { Building2, CalendarDays, IdCard, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../../auth/auth-context'
import { employeeProfile } from './employeeData'

export default function EmployeeProfilePage() {
  const { user } = useAuth()
  const profile = { ...employeeProfile, email: user?.email || employeeProfile.email }

  return (
    <div className="animate-fade-up">
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-950">Hồ sơ cá nhân</h2>
        <p className="mt-2 text-sm text-slate-500">Thông tin nhân sự đang được lưu trong hệ thống.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="bg-slate-950 px-5 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-500 text-xl font-extrabold">
              {profile.fullName.split(' ').slice(-2).map((part) => part[0]).join('')}
            </span>
            <div>
              <h3 className="text-xl font-extrabold">{profile.fullName}</h3>
              <p className="mt-1 text-sm text-white/60">{profile.position} · {profile.department}</p>
              <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                Tài khoản đang hoạt động
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {[
            { label: 'Mã nhân viên', value: profile.employeeCode, icon: IdCard },
            { label: 'Email công ty', value: profile.email, icon: Mail },
            { label: 'Phòng ban', value: profile.department, icon: Building2 },
            { label: 'Chức vụ', value: profile.position, icon: UserRound },
            { label: 'Số điện thoại', value: profile.phone, icon: Phone },
            { label: 'Ngày vào làm', value: profile.joinedAt, icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <div className="flex items-start gap-3 bg-white p-5 sm:p-6" key={label}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
