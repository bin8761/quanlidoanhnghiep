import { useMemo, useState } from 'react'
import { Download, Info, Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'

export default function ManagementPage({ config }) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return config.rows
    }

    return config.rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(keyword)),
    )
  }, [config.rows, search])

  const isReportPage = config.title === 'Báo cáo tài sản'
  const ActionIcon = isReportPage ? Download : Plus

  function handlePlaceholderSubmit(event) {
    event.preventDefault()
    setModalOpen(false)
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold text-brand-700">Quản lý dữ liệu</p>
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">{config.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{config.description}</p>
        </div>
        <Button className="w-full sm:w-auto" type="button" onClick={() => setModalOpen(true)}>
          <ActionIcon size={17} />
          {config.actionLabel}
        </Button>
      </header>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3.5 text-xs leading-5 text-blue-800">
        <Info className="mt-0.5 shrink-0" size={16} />
        <span>
          Dữ liệu hiện tại phục vụ giao diện tuần 1. API client đã sẵn sàng để kết nối
          các endpoint CRUD trong giai đoạn tiếp theo.
        </span>
      </div>

      <DataTable
        columns={config.columns}
        rows={filteredRows}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={config.searchPlaceholder}
      />

      {modalOpen && (
        <Modal
          title={config.actionLabel}
          description="Điền đầy đủ thông tin bên dưới để tạo bản ghi mới."
          onClose={() => setModalOpen(false)}
        >
          <form className="grid gap-5" onSubmit={handlePlaceholderSubmit}>
            {config.formFields.map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                required
              />
            ))}
            <div className="mt-1 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </Button>
              <Button className="w-full sm:w-auto" type="submit">
                Lưu bản nháp
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
