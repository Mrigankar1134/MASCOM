'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { gallery } from '@/content/gallery'
import { Segmented } from '@/components/ui/Segmented'
import { Icon } from '@/components/shell/Icons'
import { SectionHeading } from './Sections'

export function GalleryWall() {
  const [active, setActive] = useState(gallery[0]?.title ?? '')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const section = gallery.find((s) => s.title === active) ?? gallery[0]
  const items = section?.items ?? []

  const step = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (current === null) return current
        return (current + delta + items.length) % items.length
      })
    },
    [items.length],
  )

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox, step])

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        id="gallery"
        eyebrow="Captured moments"
        title="Photo gallery"
        body={section?.blurb}
      />

      <Segmented
        options={gallery.map((s) => ({ value: s.title, label: s.title, count: s.items.length }))}
        value={active}
        onChange={(next) => setActive(next)}
        className="mb-6 max-w-full"
      />

      {/* Masonry via CSS columns — keeps portrait and landscape shots honest */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3"
      >
        {items.map((item, i) => (
          <button
            key={item.src}
            onClick={() => setLightbox(i)}
            className="glass press group block w-full overflow-hidden rounded-2xl p-1 text-left"
            aria-label={`Open ${item.title}`}
          >
            <span className="relative block overflow-hidden rounded-[0.85rem]">
              <Image
                src={item.src}
                alt={item.title}
                width={600}
                height={800}
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 pt-8 t-caption-1 font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}
              >
                {item.title}
              </span>
            </span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence>
        {lightbox !== null && items[lightbox] && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setLightbox(null)}
              aria-label="Close gallery"
            />

            <motion.figure
              key={items[lightbox].src}
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative z-10 max-h-[86dvh] w-full max-w-4xl"
            >
              <Image
                src={items[lightbox].src}
                alt={items[lightbox].title}
                width={1600}
                height={1200}
                sizes="90vw"
                className="max-h-[78dvh] w-full rounded-3xl object-contain"
              />
              <figcaption className="mt-3 text-center t-footnote font-medium text-white/80">
                {items[lightbox].title}
                <span className="ml-2 text-white/40 tabular">
                  {lightbox + 1} / {items.length}
                </span>
              </figcaption>
            </motion.figure>

            <button
              onClick={() => step(-1)}
              className="glass press absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full text-white sm:left-6"
              aria-label="Previous photo"
            >
              <Icon.ChevronLeft size={20} />
            </button>
            <button
              onClick={() => step(1)}
              className="glass press absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full text-white sm:right-6"
              aria-label="Next photo"
            >
              <Icon.Chevron size={20} />
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="glass press absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-full text-white sm:right-6 sm:top-6"
              aria-label="Close"
            >
              <Icon.X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
