import Link from 'next/link'
import { site } from '@/content/site'
import { Wordmark } from './Wordmark'

export function Footer() {
  return (
    <footer
      className="mt-10 border-t px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-12 sm:px-6"
      style={{ borderColor: 'var(--separator-soft)' }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 t-subhead leading-relaxed text-[var(--label-2)]">
              {site.longName}, {site.institute}. Limited drops, ordered and tracked from your phone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterColumn
              title="Shop"
              links={[
                { href: '/shop', label: 'Latest drop' },
                { href: '/orders', label: 'Your orders' },
                { href: '/bag', label: 'Your bag' },
              ]}
            />
            <FooterColumn
              title="Committee"
              links={[
                { href: '/#about', label: 'About' },
                { href: '/#what-we-do', label: 'What we do' },
                { href: '/#team', label: 'Team' },
                { href: '/#gallery', label: 'Gallery' },
              ]}
            />
            <FooterColumn
              title="Follow"
              links={[
                { href: site.instagram, label: 'Instagram', external: true },
                { href: site.linkedin, label: 'LinkedIn', external: true },
              ]}
            />
          </div>
        </div>

        <div
          className="mt-12 flex flex-col gap-2 border-t pt-6 t-caption-1 text-[var(--label-3)] sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'var(--separator-soft)' }}
        >
          <p>
            © {new Date().getFullYear()} {site.name} — {site.institute}
          </p>
          <p>Payments are collected by committee members over UPI.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string; external?: boolean }[]
}) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer noopener' : undefined}
              className="t-subhead text-[var(--label-2)] transition-colors hover:text-[var(--label)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
