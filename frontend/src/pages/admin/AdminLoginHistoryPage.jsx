import { useState, useEffect } from 'react'
import { loginHistoryApi } from '../../api/loginHistory'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'react-toastify'
import { Shield, RefreshCw } from 'lucide-react'

export default function AdminLoginHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await loginHistoryApi.list({ page: 1, pageSize: 100 })
      setHistory(data.items || [])
    } catch (error) {
      toast.error('Không thể tải lịch sử đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { 
      key: 'user', 
      label: 'Email tài khoản',
      render: (value) => value?.email || 'Không rõ'
    },
    { 
      key: 'createdAt', 
      label: 'Thời gian',
      render: (value) => new Date(value).toLocaleString('vi-VN')
    },
    { key: 'ipAddress', label: 'Địa chỉ IP' },
    { key: 'browser', label: 'Trình duyệt' },
    { key: 'os', label: 'Hệ điều hành' },
    { key: 'device', label: 'Thiết bị' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
          value === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {value === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </span>
      )
    }
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="An ninh & Hệ thống"
        title="Lịch sử đăng nhập hệ thống"
        description="Ghi nhận hoạt động đăng nhập của toàn bộ tài khoản để kiểm soát an ninh thông tin."
        icon={Shield}
        actions={
          <Button variant="secondary" onClick={fetchHistory}>
            <RefreshCw size={16} /> Làm mới
          </Button>
        }
      />

      <div className="mt-6">
        {loading ? (
          <div className="skeleton h-64 rounded-[18px]" />
        ) : (
          <DataTable
            columns={columns}
            rows={history}
            searchPlaceholder="Tìm kiếm theo email, IP hoặc hệ điều hành..."
          />
        )}
      </div>
    </div>
  )
}
