'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ShopProduct } from '@/lib/data'
import { ProductCard } from '@/components/shop/ProductCard'
import { Glass } from '@/components/ui/Glass'
import { Icon } from '@/components/shell/Icons'
import { SectionHeading } from './Sections'

export function DropShowcase({ products }: { products: ShopProduct[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id="merch"
          eyebrow="Latest drop"
          title={products.length > 0 ? 'Out now' : 'Nothing live right now'}
          body={
            products.length > 0
              ? 'Pick a size and colour, pay on UPI, then watch it all the way to the collection counter.'
              : "We're prepping the next one. Sign in and it will show up here the second it opens."
          }
        />
        {products.length > 0 && (
          <Link
            href="/shop"
            className="glass press mb-8 hidden items-center gap-2 rounded-full px-4 py-2.5 t-footnote font-semibold lg:mb-12 lg:inline-flex"
          >
            See everything
            <Icon.ArrowRight size={16} />
          </Link>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.slice(0, 8).map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Glass className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: 'var(--tint-glow)', color: 'var(--tint)' }}
            >
              <Icon.Box size={24} />
            </span>
            <div>
              <h3 className="t-title-3 font-semibold tracking-tight">Nothing live right now</h3>
              <p className="mx-auto mt-2 max-w-sm t-subhead leading-relaxed text-[var(--label-2)]">
                Drops stay open for a few days at most. Make an account now so checkout takes
                seconds when the next one lands.
              </p>
            </div>
            <Link
              href="/signup"
              className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 t-subhead font-semibold"
              style={{ background: 'var(--tint-solid)', color: 'var(--tint-contrast)' }}
            >
              Make an account
              <Icon.ArrowRight size={16} />
            </Link>
          </Glass>
        </motion.div>
      )}
    </section>
  )
}
