import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, safely } from '@/lib/data'
import { ProductDetail } from '@/components/shop/ProductDetail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await safely(() => getProductBySlug(slug), null)
  if (!product) return { title: 'Not found' }
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? 'A MASCOM drop.',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await safely(() => getProductBySlug(slug), null)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
