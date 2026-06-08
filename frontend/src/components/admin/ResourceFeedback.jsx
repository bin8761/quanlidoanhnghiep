import { CircleAlert, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'

export function ResourceError({ message, onRetry }) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-[14px] border border-red-200 bg-red-50/80 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <div className="flex items-start gap-3 text-sm text-red-700">
        <CircleAlert className="mt-0.5 shrink-0" size={18} />
        <span>{message}</span>
      </div>
      <Button variant="secondary" size="sm" type="button" onClick={onRetry}>
        <RefreshCw size={15} />
        Thử lại
      </Button>
    </div>
  )
}

export function ResourceTableSkeleton({ columns = 4 }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="skeleton h-11 w-full max-w-[390px] rounded-[10px]" />
        <div className="skeleton h-10 w-24 rounded-[10px]" />
      </div>
      <div className="grid gap-4 p-5">
        {[1, 2, 3, 4].map((row) => (
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} key={row}>
            {Array.from({ length: columns }, (_, index) => (
              <div className="skeleton h-5 rounded-md" key={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
