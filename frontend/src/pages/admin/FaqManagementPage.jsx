import { useMemo, useState, useEffect } from 'react'
import { faqApi } from '../../api/faqs'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormField from '../../components/ui/FormField'
import DataTable from '../../components/ui/DataTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { toast } from 'react-toastify'
import { HelpCircle, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { matchesSearch } from '../../utils/search'

export default function FaqManagementPage() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  
  // Form state
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('SHOW')
  const [submitting, setSubmitting] = useState(false)

  // Confirm delete state
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    let active = true

    faqApi.list({ adminMode: 'true' })
      .then((data) => {
        if (active) setFaqs(data)
      })
      .catch(() => {
        if (active) toast.error('Không thể tải danh sách FAQ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const data = await faqApi.list({ adminMode: 'true' })
      setFaqs(data)
    } catch {
      toast.error('Không thể tải danh sách FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingFaq(null)
    setQuestion('')
    setAnswer('')
    setCategory('Đăng nhập')
    setStatus('SHOW')
    setModalOpen(true)
  }

  const handleOpenEdit = (faq) => {
    setEditingFaq(faq)
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setCategory(faq.category)
    setStatus(faq.status)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim() || !category.trim()) {
      toast.warning('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    try {
      setSubmitting(true)
      const payload = { question, answer, category, status }
      if (editingFaq) {
        await faqApi.update(editingFaq.id, payload)
        toast.success('Cập nhật FAQ thành công!')
      } else {
        await faqApi.create(payload)
        toast.success('Tạo FAQ thành công!')
      }
      setModalOpen(false)
      fetchFaqs()
    } catch (error) {
      toast.error(error.message || 'Lưu FAQ thất bại!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (faq) => {
    const nextStatus = faq.status === 'SHOW' ? 'HIDE' : 'SHOW'
    setFaqs((current) => current.map((item) => (
      item.id === faq.id ? { ...item, status: nextStatus } : item
    )))

    try {
      const updated = await faqApi.toggleStatus(faq.id, faq.status)
      setFaqs((current) => current.map((item) => (
        item.id === faq.id ? updated : item
      )))
      toast.success('Thay đổi trạng thái FAQ thành công!')
    } catch {
      setFaqs((current) => current.map((item) => (
        item.id === faq.id ? { ...item, status: faq.status } : item
      )))
      toast.error('Thay đổi trạng thái thất bại!')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await faqApi.remove(deleteId)
      toast.success('Xóa FAQ thành công!')
      setDeleteId(null)
      fetchFaqs()
    } catch {
      toast.error('Xóa FAQ thất bại!')
    }
  }

  const columns = [
    { key: 'category', label: 'Danh mục' },
    { key: 'question', label: 'Câu hỏi' },
    { 
      key: 'status', 
      label: 'Trạng thái', 
      render: (value, row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
            value === 'SHOW' 
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {value === 'SHOW' ? (
            <>
              <Eye size={12} /> Hiển thị
            </>
          ) : (
            <>
              <EyeOff size={12} /> Ẩn
            </>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition"
            title="Chỉnh sửa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  const filteredFaqs = useMemo(
    () => faqs.filter((faq) => matchesSearch(search, [
      faq.question,
      faq.answer,
      faq.category,
      faq.status === 'SHOW' ? 'Hiển thị' : 'Ẩn',
    ])),
    [faqs, search],
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Cổng hỗ trợ & Hướng dẫn"
        title="Quản lý FAQ"
        description="Quản lý bộ câu hỏi thường gặp hiển thị cho nhân viên trong phần Cài đặt."
        icon={HelpCircle}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm FAQ
          </Button>
        }
      />

      <div className="mt-6">
        {loading ? (
          <div className="skeleton h-64 rounded-[18px]" />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredFaqs}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm kiếm câu hỏi, câu trả lời hoặc danh mục..."
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal
          title={editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm mới FAQ'}
          description="Thiết lập câu hỏi thường gặp và câu trả lời chi tiết."
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Danh mục" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input text-xs"
                required
              >
                <option value="Đăng nhập">Đăng nhập</option>
                <option value="Tài sản">Tài sản</option>
                <option value="Nhân viên">Nhân viên</option>
                <option value="Báo cáo">Báo cáo</option>
                <option value="Chấm công">Chấm công</option>
                <option value="Xuất dữ liệu">Xuất dữ liệu</option>
                <option value="Tài khoản">Tài khoản</option>
                <option value="Bảo mật">Bảo mật</option>
                <option value="Góp ý & Hỗ trợ">Góp ý & Hỗ trợ</option>
              </select>
            </FormField>

            <FormField label="Câu hỏi" required>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="VD: Làm cách nào để đổi mật khẩu?"
                className="form-input text-xs"
                required
              />
            </FormField>

            <FormField label="Câu trả lời" required>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Nhập nội dung câu trả lời hướng dẫn chi tiết tại đây..."
                rows={5}
                className="form-input text-xs resize-y"
                required
              />
            </FormField>

            <FormField label="Trạng thái hiển thị">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-input text-xs"
              >
                <option value="SHOW">Hiển thị (Nhân viên nhìn thấy)</option>
                <option value="HIDE">Ẩn (Không hiển thị)</option>
              </select>
            </FormField>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmDialog
          title="Xóa câu hỏi FAQ"
          description="Bạn có chắc chắn muốn xóa câu hỏi FAQ này không? Hành động này không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
