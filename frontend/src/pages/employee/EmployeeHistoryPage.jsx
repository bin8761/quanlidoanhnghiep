import { useState, useEffect } from 'react'
import { attendanceApi } from '../../api/attendance'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import { History, CalendarDays, Clock } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

export default function EmployeeHistoryPage() {
  const { t } = useLanguage()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const data = await attendanceApi.getMyHistory()
      setHistory(data)
    } catch (error) {
      toast.error('Không thể tải lịch sử chấm công')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Nhật ký chấm công"
        title={t('attendanceHistory')}
        description="Theo dõi toàn bộ lịch sử chấm công Check-In và Check-Out hàng ngày của bạn."
      />

      <div className="mt-6">
        {loading ? (
          <div className="skeleton h-64 rounded-[18px]" />
        ) : (
          <div className="surface overflow-hidden">
            <div className="hidden grid-cols-4 gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid sm:px-6">
              <span>{t('time').split(' ')[0]}</span>
              <span>{t('checkIn')}</span>
              <span>{t('checkOut')}</span>
              <span>{t('totalHours')}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-5 py-4 sm:px-6 md:grid-cols-4 md:items-center md:gap-4"
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <CalendarDays size={14} className="text-slate-400" />
                    {new Date(item.date).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {item.checkIn ? new Date(item.checkIn).toLocaleTimeString('vi-VN') : '--:--'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {item.checkOut ? new Date(item.checkOut).toLocaleTimeString('vi-VN') : '--:--'}
                  </span>
                  <span className="text-xs font-bold text-brand-700 dark:text-emerald-300">
                    {item.totalHours ? `${Number(item.totalHours).toFixed(2)} giờ` : '0.00 giờ'}
                  </span>
                </div>
              ))}
              {!history.length && (
                <div className="grid min-h-56 place-items-center text-center">
                  <div>
                    <History className="mx-auto text-slate-300" size={30} />
                    <p className="mt-3 text-xs text-slate-500 italic">{t('noAttendanceData')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
