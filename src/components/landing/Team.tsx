'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { coordinators } from '@/content/site'
import { initials } from '@/lib/format'
import { SectionHeading } from './Sections'

export function Team() {
  const leads = coordinators.filter((c) => !c.ipm)
  const ipm = coordinators.filter((c) => c.ipm)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        id="team"
        eyebrow="The team"
        title="Meet the coordinators"
        body="The people who design the drops, chase the sponsors, and hand you the kit."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {leads.map((person, i) => (
          <PersonCard key={person.name} person={person} index={i} />
        ))}
      </div>

      {ipm.length > 0 && (
        <div className="mt-10">
          <p className="eyebrow mb-4">IPM Coordinator</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {ipm.map((person, i) => (
              <PersonCard key={person.name} person={person} index={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function PersonCard({
  person,
  index,
}: {
  person: (typeof coordinators)[number]
  index: number
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="glass glass-lens glass-interactive group overflow-hidden rounded-[1.4rem] p-1.5"
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.05rem]"
        style={{ background: 'var(--separator-soft)' }}
      >
        {person.photo ? (
          <Image
            src={person.photo}
            alt={person.name}
            fill
            sizes="(max-width: 768px) 45vw, 18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span
            className="display absolute inset-0 grid place-items-center text-4xl"
            style={{ color: 'var(--tint)' }}
          >
            {initials(person.name)}
          </span>
        )}

        {/* Legibility scrim so the name reads over any photo */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }}
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="t-footnote font-semibold leading-tight text-white drop-shadow">
            {person.name}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-white/70">{person.role}</p>
        </div>
      </div>
    </motion.article>
  )
}
