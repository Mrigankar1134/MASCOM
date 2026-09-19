import { getShopProducts } from '@/lib/data'
import { ok, route } from '@/lib/api-helpers'

export const GET = route(async () => {
  const products = await getShopProducts()
  return ok({ products })
})
