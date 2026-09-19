import { Skeleton } from '@/components/ui/Feedback'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6" aria-busy aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-12 w-64" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-[1.5rem]" />
        ))}
      </div>
    </div>
  )
}
