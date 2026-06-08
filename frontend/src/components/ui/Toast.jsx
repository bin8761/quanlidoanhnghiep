import { useEffect } from 'react'
import { toast } from 'react-toastify'

const TOAST_ID = 'eam-notification'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (toast.isActive(TOAST_ID)) {
      toast.update(TOAST_ID, {
        render: message,
        type,
        autoClose: 3500,
        onClose,
      })
      return
    }

    toast(message, { toastId: TOAST_ID, type, onClose })
  }, [message, onClose, type])

  return null
}
