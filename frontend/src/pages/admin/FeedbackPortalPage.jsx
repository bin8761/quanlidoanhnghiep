import { useState, useEffect } from 'react'
import { feedbackApi } from '../../api/feedbacks'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'react-toastify'
import { MessageSquare, Eye, FileText, CheckCircle2, RefreshCw } from 'lucide-react'

export default function FeedbackPortalPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [status, setStatus] = useState('PENDING')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const data = await feedbackApi.list()
      setFeedbacks(data)
    } catch (error) {
      toast.error('Không thể tải danh sách góp ý & phản hồi')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (fb) => {
    setSelectedFeedback(fb)
    setStatus(fb.status)
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!selectedFeedback) return

    try {
      setUpdating(true)
      await feedbackApi.updateStatus(selectedFeedback.id, { status })
      toast.success('Cập nhật trạng thái góp ý thành công!')
      setSelectedFeedback(null)
      fetchFeedbacks()
    } catch (error) {
      toast.error('Cập nhật trạng thái thất bại!')
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Tiêu đề' },
    { 
      key: 'user', 
      label: 'Người gửi', 
      render: (value) => value?.email || 'N/A'
    },
    { 
      key: 'category', 
      label: 'Phân loại',
      render: (value) => {
        const types = { BUG: 'Lỗi hệ thống', FEATURE: 'Đề xuất tính năng', UI_UX: 'Giao diện & Trải nghiệm', OTHER: 'Góp ý khác' }
        return types[value] || value
      }
    },
    {
      key: 'priority',
      label: 'Độ ưu tiên',
      render: (value) => {
        const colors = { HIGH: 'bg-red-50 text-red-700', MEDIUM: 'bg-amber-50 text-amber-700', LOW: 'bg-slate-100 text-slate-600' }
        const text = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' }
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[value]}`}>{text[value] || value}</span>
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value) => {
        const colors = { COMPLETED: 'bg-emerald-50 text-emerald-700', PROCESSING: 'bg-blue-50 text-blue-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-700' }
        const text = { COMPLETED: 'Đã xử lý', PROCESSING: 'Đang xử lý', PENDING: 'Chờ xử lý', REJECTED: 'Từ chối' }
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[value]}`}>{text[value] || value}</span>
      }
    },
    {
      key: 'createdAt',
      label: 'Ngày gửi',
      render: (value) => new Date(value).toLocaleString('vi-VN')
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (_, row) => (
        <button
          onClick={() => handleOpenDetail(row)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-850 rounded-lg text-[10px] font-bold transition"
        >
          <Eye size={12} /> Xem chi tiết
        </button>
      )
    }
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Tương tác & Cải tiến"
        title="Quản lý Góp ý & Phản hồi"
        description="Duyệt các đề xuất tính năng, báo lỗi và phản hồi chất lượng hệ thống từ nhân viên."
        icon={MessageSquare}
        actions={
          <Button variant="secondary" onClick={fetchFeedbacks}>
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
            rows={feedbacks}
            searchPlaceholder="Tìm kiếm góp ý..."
          />
        )}
      </div>

      {/* Detail & Status Edit Modal */}
      {selectedFeedback && (
        <Modal
          title="Chi tiết góp ý & phản hồi"
          description="Xem chi tiết nội dung và cập nhật tiến độ xử lý góp ý."
          onClose={() => setSelectedFeedback(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Người gửi:</span>
                <span className="text-slate-700 font-semibold">{selectedFeedback.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Thời gian gửi:</span>
                <span className="text-slate-700 font-semibold">{new Date(selectedFeedback.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="text-slate-400 font-bold block">Tiêu đề:</span>
              <span className="text-slate-800 font-bold text-sm">{selectedFeedback.title}</span>
            </div>

            <div className="text-xs">
              <span className="text-slate-400 font-bold block">Nội dung góp ý:</span>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-1 text-slate-700 whitespace-pre-line leading-relaxed">
                {selectedFeedback.content}
              </div>
            </div>

            {selectedFeedback.filePath && (
              <div className="text-xs">
                <span className="text-slate-400 font-bold block">Tệp đính kèm:</span>
                <a
                  href={`http://localhost:5000/uploads/${selectedFeedback.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 border border-slate-200 hover:border-brand-500 rounded-xl text-brand-600 hover:underline transition font-bold"
                >
                  <FileText size={13} /> Tải tệp đính kèm
                </a>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-slate-100 space-y-4">
              <FormField label="Cập nhật trạng thái xử lý">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="PENDING">Chờ xử lý (Mới nhận)</option>
                  <option value="PROCESSING">Đang xử lý (Đang kiểm tra/thực hiện)</option>
                  <option value="COMPLETED">Đã xử lý (Hoàn tất/Giải quyết xong)</option>
                  <option value="REJECTED">Từ chối (Không giải quyết)</option>
                </select>
              </FormField>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedFeedback(null)}>
                  Đóng
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
