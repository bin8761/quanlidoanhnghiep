import { useEffect, useState } from 'react'
import { attendanceApi } from '../../api/attendance'
import { toast } from 'react-toastify'
import { useLanguage } from '../../hooks/useLanguage'
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react'

export default function AttendanceWidget() {
  const { t } = useLanguage()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    fetchStatus()
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchStatus = async () => {
    try {
      const data = await attendanceApi.getStatus()
      setStatus(data)
    } catch (error) {
      console.error('Lỗi khi lấy trạng thái chấm công:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setLoading(true)
      const data = await attendanceApi.checkIn()
      setStatus(data.attendance)
      toast.success(data.message || 'Check-In thành công!')
      fetchStatus()
    } catch (error) {
      toast.error(error.message || 'Check-In thất bại!')
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setLoading(true)
      const data = await attendanceApi.checkOut()
      setStatus(data.attendance)
      toast.success(data.message || 'Check-Out thành công!')
      fetchStatus()
    } catch (error) {
      toast.error(error.message || 'Check-Out thất bại!')
      setLoading(false)
    }
  }

  if (loading && !status) {
    return (
      <div className="surface overflow-hidden animate-pulse">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 h-14"></div>
        <div className="p-5 space-y-4">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const today = status?.today || {}
  const stats = status?.stats || { totalDays: 0, totalHours: 0 }
  const hasCheckedIn = !!today.checkIn
  const hasCheckedOut = !!today.checkOut

  const formattedTime = time.toLocaleTimeString('vi-VN')
  const formattedDate = time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="surface overflow-hidden transition-all duration-300 hover:shadow-xl border border-slate-100 dark:border-slate-800">
      {/* Card Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 sm:px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-brand-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{t('attendanceToday')}</h3>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            hasCheckedIn 
              ? (hasCheckedOut ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30') 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
          }`}>
            {hasCheckedIn ? (hasCheckedOut ? 'Hoàn thành' : 'Đang làm việc') : 'Chưa Check-In'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Real-time Clock display */}
        <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
          <p className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-mono">{formattedTime}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 capitalize">{formattedDate}</p>
        </div>

        {/* CheckIn / CheckOut details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100/30 dark:border-slate-800/20 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('checkIn')}</span>
            <span className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <LogIn size={13} className={hasCheckedIn ? "text-emerald-500" : "text-slate-300"} />
              {today.checkIn ? new Date(today.checkIn).toLocaleTimeString('vi-VN') : '--:--'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100/30 dark:border-slate-800/20 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('checkOut')}</span>
            <span className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <LogOut size={13} className={hasCheckedOut ? "text-emerald-500" : "text-slate-300"} />
              {today.checkOut ? new Date(today.checkOut).toLocaleTimeString('vi-VN') : '--:--'}
            </span>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1"><Calendar size={12} /> Chấm công tuần này: <strong className="text-slate-700 dark:text-slate-200">{stats.totalDays} ngày</strong></span>
          <span>{t('totalHours')}: <strong className="text-brand-600 dark:text-emerald-400">{stats.totalHours.toFixed(2)}h</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleCheckIn}
            disabled={hasCheckedIn || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-600 border border-transparent transition shadow-sm hover:shadow-md disabled:shadow-none"
          >
            <LogIn size={14} />
            Check-In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!hasCheckedIn || hasCheckedOut || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-600 border border-transparent transition shadow-sm hover:shadow-md disabled:shadow-none"
          >
            <LogOut size={14} />
            Check-Out
          </button>
        </div>
      </div>
    </div>
  )
}
