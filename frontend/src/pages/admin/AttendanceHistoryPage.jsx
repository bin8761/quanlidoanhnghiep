import { useMemo, useState, useEffect } from 'react'
import { attendanceApi } from '../../api/attendance'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'react-toastify'
import { CalendarCheck, RefreshCw } from 'lucide-react'
import { matchesSearch } from '../../utils/search'

export default function AttendanceHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    attendanceApi.getAllHistory()
      .then((data) => {
        if (active) setHistory(Array.isArray(data) ? data : (data.items || []))
      })
      .catch(() => {
        if (active) toast.error('Không thể tải lịch sử chấm công')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await attendanceApi.getAllHistory()
      setHistory(Array.isArray(data) ? data : (data.items || []))
    } catch {
      toast.error('Không thể tải lịch sử chấm công')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { 
      key: 'employee', 
      label: 'Nhân viên',
      render: (value) => value ? `${value.fullName} (${value.employeeCode})` : 'N/A'
    },
    { 
      key: 'date', 
      label: 'Ngày',
      render: (value) => new Date(value).toLocaleDateString('vi-VN')
    },
    {
      key: 'checkIn',
      label: 'Check-In',
      render: (value) => value ? new Date(value).toLocaleTimeString('vi-VN') : '--:--'
    },
    {
      key: 'checkOut',
      label: 'Check-Out',
      render: (value) => value ? new Date(value).toLocaleTimeString('vi-VN') : '--:--'
    },
    {
      key: 'totalHours',
      label: 'Số giờ làm việc',
      render: (value) => value ? `${Number(value).toFixed(2)} giờ` : '0.00 giờ'
    }
  ]

  const filteredHistory = useMemo(
    () => history.filter((record) => matchesSearch(search, [
      record.employee?.fullName,
      record.employee?.employeeCode,
      record.employee?.email,
      record.date,
      record.checkIn ? new Date(record.checkIn).toLocaleString('vi-VN') : '',
      record.checkOut ? new Date(record.checkOut).toLocaleString('vi-VN') : '',
      record.totalHours,
    ])),
    [history, search],
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Quản lý nhân sự"
        title="Lịch sử chấm công"
        description="Kiểm tra thời gian check-in, check-out và tổng số giờ làm việc thực tế của nhân sự."
        icon={CalendarCheck}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchHistory}>
              <RefreshCw size={16} /> Làm mới
            </Button>
          </div>
        }
      />

      <div className="mt-6">
        {loading ? (
          <div className="skeleton h-64 rounded-[18px]" />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredHistory}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm kiếm theo tên nhân viên hoặc mã nhân viên..."
          />
        )}
      </div>
    </div>
  )
}
