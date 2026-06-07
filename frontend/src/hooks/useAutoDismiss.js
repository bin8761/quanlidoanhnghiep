import { useEffect } from 'react'

export default function useAutoDismiss(value, setValue, delay = 3500) {
  useEffect(() => {
    if (!value) return undefined

    const timer = window.setTimeout(() => setValue(null), delay)
    return () => window.clearTimeout(timer)
  }, [delay, setValue, value])
}
