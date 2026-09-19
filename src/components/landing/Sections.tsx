'use client'

import { motion } from 'framer-motion'
import { Glass } from '@/components/ui/Glass'
import { about, services } from '@/content/site'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, ease: [0.32, 0.72, 0, 1] as const },
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  id,
}: {
  eyebrow: string
  title: string
  body?: string
  id?: string
}) {
  return (
    <motion.header {...reveal} id={id} className="mb-8 max-w-2xl scroll-mt-24 lg:mb-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-3 text-[clamp(2rem,5.5vw,3.25rem)]">{title}</h2>
      {body && (
        <p className="mt-4 t-callout leading-relaxed text-[var(--label-2)]">{body}</p>
      )}
      <span
        className="mt-6 block h-px w-16"
        style={{ background: 'linear-gradient(90deg, var(--tint), transparent)' }}
      />
    </motion.header>
  )
}

export function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading id="about" eyebrow={about.eyebrow} title={about.title} body={about.body} />
    </section>
  )
}

export function Services() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        id="what-we-do"
        eyebrow="What we do"
        title="The work behind every drop"
        body="MASCOM is not just a merch desk. We build sponsor relationships, bring brands to campus events, design and source customised merchandise, and coordinate vendors so institute experiences feel sharper, better funded, and more memorable."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service, i) => (
          <motion.div
            key={service.no}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.32, 0.72, 0, 1] }}
          >
            <Glass interactive className="h-full p-6 lg:p-8">
              <span
                className="display text-[34px] leading-none"
                style={{ color: 'var(--tint)', opacity: 0.85 }}
              >
                {service.no}
              </span>
              <h3 className="mt-5 t-title-3 font-semibold tracking-tight">{service.title}</h3>
              <p className="mt-2.5 t-subhead leading-relaxed text-[var(--label-2)]">
                {service.body}
              </p>
            </Glass>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
