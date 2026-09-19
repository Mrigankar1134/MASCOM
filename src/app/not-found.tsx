import Link from 'next/link'
import { Glass } from '@/components/ui/Glass'
import { Icon } from '@/components/shell/Icons'
import { Wordmark } from '@/components/shell/Wordmark'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <Link href="/" className="press mb-8">
        <Wordmark />
      </Link>

      <Glass tone="strong" className="w-full max-w-md p-8 text-center">
        <p className="display text-[64px] leading-none" style={{ color: 'var(--tint)' }}>
          404
        </p>
        <h1 className="mt-4 t-title-3 font-semibold tracking-tight">
          That page is not here
        </h1>
        <p className="mt-2 t-subhead leading-relaxed text-[var(--label-2)]">
          The link may be old, or the drop it pointed at has closed.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="press inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 t-subhead font-semibold"
            style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
          >
            Go to the shop
            <Icon.ArrowRight size={16} />
          </Link>
          <Link
            href="/"
            className="glass press inline-flex items-center justify-center rounded-2xl px-5 py-3 t-subhead font-semibold"
          >
            Back to home
          </Link>
        </div>
      </Glass>
    </main>
  )
}
