import { useCallback, useEffect, useMemo, useState } from 'react'
import { feedbackApi, getFeedbackFileName, getFeedbackFileUrl } from '../../api/feedbacks'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import DataTable from '../../components/ui/DataTable'
import { toast } from 'react-toastify'
import { MessageSquare, Eye, FileText, RefreshCw } from 'lucide-react'
import { matchesSearch } from '../../utils/search'
import { useLanguage } from '../../hooks/useLanguage'

export default function FeedbackPortalPage() {
  const { t, locale } = useLanguage()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [status, setStatus] = useState('PENDING')
  const [updating, setUpdating] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await feedbackApi.list()
      setFeedbacks(data)
    } catch {
      toast.error('Không thể tải danh sách góp ý & phản hồi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    feedbackApi.list()
      .then((data) => {
        if (active) setFeedbacks(data)
      })
      .catch(() => {
        if (active) toast.error('Không thể tải danh sách góp ý & phản hồi')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

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
    } catch {
      toast.error('Cập nhật trạng thái thất bại!')
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    { key: 'title', label: t('Tiêu đề'), render: (value) => t(value) },
    { 
      key: 'user', 
      label: t('Người gửi'), 
      render: (value) => value?.email || 'N/A'
    },
    { 
      key: 'category', 
      label: t('Phân loại'),
      render: (value) => {
        const types = { BUG: 'Lỗi hệ thống', FEATURE: 'Đề xuất tính năng', UI_UX: 'Giao diện & Trải nghiệm', OTHER: 'Góp ý khác' }
        return t(types[value] || value)
      }
    },
    {
      key: 'priority',
      label: t('Độ ưu tiên'),
      render: (value) => {
        const colors = { HIGH: 'bg-red-50 text-red-700', MEDIUM: 'bg-amber-50 text-amber-700', LOW: 'bg-slate-100 text-slate-600' }
        const text = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' }
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[value]}`}>{t(text[value] || value)}</span>
      }
    },
    {
      key: 'status',
      label: t('Trạng thái'),
      render: (value) => {
        const colors = { COMPLETED: 'bg-emerald-50 text-emerald-700', PROCESSING: 'bg-blue-50 text-blue-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-700' }
        const text = { COMPLETED: 'Đã xử lý', PROCESSING: 'Đang xử lý', PENDING: 'Chờ xử lý', REJECTED: 'Từ chối' }
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[value]}`}>{t(text[value] || value)}</span>
      }
    },
    {
      key: 'createdAt',
      label: t('Ngày gửi'),
      render: (value) => new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')
    },
    {
      key: 'fileUrl',
      label: t('Đính kèm'),
      render: (value) => value ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <FileText size={12} /> {t('Có tệp')}
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{t('Không có')}</span>
      )
    },
    {
      key: 'actions',
      label: t('Hành động'),
      render: (_, row) => (
        <button
          onClick={() => handleOpenDetail(row)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-850 rounded-lg text-[10px] font-bold transition"
        >
          <Eye size={12} /> {t('Xem chi tiết')}
        </button>
      )
    }
  ]

  const filteredFeedbacks = useMemo(
    () => feedbacks.filter((feedback) => matchesSearch(search, [
      feedback.title,
      feedback.content,
      feedback.user?.email,
      feedback.user?.employee?.fullName,
      feedback.category,
      feedback.priority,
      feedback.status,
      feedback.fileUrl ? 'Có tệp đính kèm' : 'Không có tệp',
    ])),
    [feedbacks, search],
  )

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
            rows={filteredFeedbacks}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm kiếm góp ý..."
          />
        )}
      </div>

      {/* Detail & Status Edit Modal */}
      {selectedFeedback && (
        <Modal
          title={t('Chi tiết góp ý & phản hồi')}
          description={t('Xem chi tiết nội dung và cập nhật tiến độ xử lý góp ý.')}
          onClose={() => setSelectedFeedback(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">{t('Người gửi')}:</span>
                <span className="text-slate-700 font-semibold">{selectedFeedback.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">{t('Thời gian gửi')}:</span>
                <span className="text-slate-700 font-semibold">{new Date(selectedFeedback.createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="text-slate-400 font-bold block">{t('Tiêu đề')}:</span>
              <span className="text-slate-800 font-bold text-sm">{t(selectedFeedback.title)}</span>
            </div>

            <div className="text-xs">
              <span className="text-slate-400 font-bold block">{t('Nội dung góp ý')}:</span>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-1 text-slate-700 whitespace-pre-line leading-relaxed">
                {t(selectedFeedback.content)}
              </div>
            </div>

            {selectedFeedback.fileUrl && (
              <div className="text-xs">
                <span className="text-slate-400 font-bold block dark:text-slate-500">{t('Tệp đính kèm')}:</span>
                <a
                  href={getFeedbackFileUrl(selectedFeedback.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-brand-700 transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-brand-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                >
                  <FileText className="shrink-0" size={14} />
                  <span className="truncate">{getFeedbackFileName(selectedFeedback.fileUrl)}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-slate-400">{t('Mở / tải xuống')}</span>
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
