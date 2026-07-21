import { TriangleAlert } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'
import { useLanguage } from '../../hooks/useLanguage'

export default function ConfirmDialog({
  title,
  message,
  description,
  confirmLabel = 'Xác nhận',
  isSubmitting = false,
  onConfirm,
  onClose,
  onCancel,
}) {
  const { t } = useLanguage()
  const handleClose = onClose || onCancel
  const dialogMessage = message || description

  return (
    <Modal title={t(title)} description={t(dialogMessage)} onClose={handleClose}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <TriangleAlert className="shrink-0 text-amber-600" size={20} />
          <p className="text-sm leading-6 text-amber-800">
            {t('Thao tác này không thể hoàn tác. Hãy kiểm tra kỹ trước khi tiếp tục.')}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={handleClose}
        >
          {t('Hủy')}
        </Button>
        <Button
          className="w-full sm:w-auto"
          type="button"
          variant="danger"
          disabled={isSubmitting}
          onClick={onConfirm}
        >
          {isSubmitting && (
            <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
          )}
          {t(confirmLabel)}
        </Button>
      </div>
    </Modal>
  )
}
