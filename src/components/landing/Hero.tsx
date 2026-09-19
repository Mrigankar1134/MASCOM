'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Icon } from '@/components/shell/Icons'
import { site, stats } from '@/content/site'
import { heroShots } from '@/content/gallery'

export function Hero({ ordersOpen, dropName }: { ordersOpen: boolean; dropName?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // Layered parallax: the photo stack drifts slower than the copy, which reads
  // as depth behind the glass rather than a flat hero image.
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '18%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-8%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.25])

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:pb-28 lg:pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div style={{ y: copyY, opacity: fade }} className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="eyebrow"
          >
            {site.longName}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.06, ease: [0.32, 0.72, 0, 1] }}
            className="display mt-4 text-[clamp(3.2rem,13vw,6.5rem)]"
          >
            Drop
            <br />
            your
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(120deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, var(--page-fg)) 60%, var(--page-fg) 100%)',
              }}
            >
              fit.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.32, 0.72, 0, 1] }}
            className="mt-6 max-w-md text-[16.5px] leading-relaxed text-[var(--muted-fg)]"
          >
            {site.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/shop"
              className="press inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-semibold shadow-[0_10px_30px_-10px_var(--accent-glow)]"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              {ordersOpen ? 'Shop the drop' : 'Browse merch'}
              <Icon.ArrowRight size={18} />
            </Link>
            <Link
              href="#gallery"
              className="glass glass-lens press inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold"
            >
              See the work
            </Link>
          </motion.div>

          {/* Live drop status — the one thing a returning student looks for */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="glass glass-lens mt-9 inline-flex max-w-md items-center gap-4 rounded-3xl p-4 pr-6"
          >
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: ordersOpen ? 'var(--ok-bg)' : 'var(--hairline-soft)', color: ordersOpen ? 'var(--ok)' : 'var(--muted-fg)' }}
            >
              {ordersOpen && (
                <span className="absolute inset-0 animate-ping rounded-2xl opacity-40" style={{ background: 'var(--ok-bg)' }} />
              )}
              {ordersOpen ? <Icon.Sparkle size={20} /> : <Icon.Clock size={20} />}
            </span>
            <div className="min-w-0">
              <p className="eyebrow">{ordersOpen ? 'Orders open' : 'Next drop'}</p>
              <p className="truncate text-[15px] font-semibold">
                {ordersOpen
                  ? (dropName ?? 'Batch polo drop is live')
                  : 'Sign in to be first when it lands'}
              </p>
            </div>
          </motion.div>

          <dl className="mt-10 flex gap-8 lg:gap-12">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.36 + i * 0.06 }}
              >
                <dt className="display text-[28px] sm:text-[34px]">{s.value}</dt>
                <dd className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint-fg)]">
                  {s.label}
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>

        {/* Photo stack */}
        <motion.div style={{ y: photoY }} className="relative">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-lg lg:max-w-none">
            {heroShots.slice(0, 3).map((src, i) => {
              const layout = [
                'inset-0 z-30',
                'left-[8%] top-[10%] z-20 rotate-[-5deg] opacity-90',
                'left-[16%] top-[19%] z-10 rotate-[6deg] opacity-75',
              ][i]
              return (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: 40, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.1 + (2 - i) * 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className={`glass glass-lifted absolute h-[82%] w-[82%] overflow-hidden rounded-[2rem] p-1.5 ${layout}`}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[1.7rem]">
                    <Image
                      src={src}
                      alt=""
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 80vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
