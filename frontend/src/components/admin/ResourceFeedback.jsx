import { CircleAlert, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'

export function ResourceError({ message, onRetry }) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="h-11 w-full max-w-[390px] animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid gap-4 p-5">
        {[1, 2, 3, 4].map((row) => (
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} key={row}>
            {Array.from({ length: columns }, (_, index) => (
              <div className="h-5 animate-pulse rounded-md bg-slate-100" key={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
