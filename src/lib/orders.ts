import 'server-only'
import { Order, type OrderDoc } from '@/lib/models/Order'
import type { ItemStatus, OrderStatus } from '@/lib/constants'

/**
 * Derives the order-level status from its items plus the payment state.
 * Kept identical in spirit to the previous server so existing orders keep
 * resolving to the same status they always had.
 */
export function deriveOrderStatus(order: {
  items: { itemStatus?: ItemStatus | string | null }[]
  paymentStatus?: string | null
}): OrderStatus {
  const statuses = order.items.map((i) => i.itemStatus)

  if (statuses.length > 0 && statuses.every((s) => s === 'Delivered')) return 'Delivered'
  if (statuses.length > 0 && statuses.every((s) => s === 'Failed')) return 'Failed'
  if (statuses.some((s) => s === 'Delivered')) return 'Partially Fulfilled'
  if (statuses.some((s) => s === 'Processing')) return 'Processing'
  if (order.paymentStatus === 'Paid') return 'Confirmed'
  return 'Verification Pending'
}

/**
 * Next sequential public order id (ORD00001, ORD00002, …).
 * Retried by the caller, since two concurrent checkouts can pick the same
 * number and the unique index on `orderId` will reject the loser.
 */
export async function nextOrderId(): Promise<string> {
  try {
    const [result] = await Order.aggregate<{ maxNumber: number }>([
      { $match: { orderId: { $regex: /^ORD\d+$/ } } },
      { $addFields: { orderNumber: { $toInt: { $substr: ['$orderId', 3, -1] } } } },
      { $group: { _id: null, maxNumber: { $max: '$orderNumber' } } },
    ])
    const next = (result?.maxNumber ?? 0) + 1
    return `ORD${String(next).padStart(5, '0')}`
  } catch {
    return `ORD${Date.now()}`
  }
}

/** Flags that make an order worth a closer look during verification. */
export function assessRisk(input: {
  finalAmountPaid: number
  itemCount: number
  recentOrdersByUser: number
}): { riskScore: number; fraudFlags: string[] } {
  let riskScore = 0
  const fraudFlags: string[] = []

  if (input.finalAmountPaid > 5000) {
    riskScore += 20
    fraudFlags.push('high_amount')
  }
  if (input.itemCount > 10) {
    riskScore += 15
    fraudFlags.push('many_items')
  }
  if (input.recentOrdersByUser >= 3) {
    riskScore += 25
    fraudFlags.push('rapid_orders')
  }

  return { riskScore: Math.min(riskScore, 100), fraudFlags }
}

export type SerializedOrder = ReturnType<typeof serializeOrder>

/** Mongo documents are not serialisable across the server/client boundary. */
export function serializeOrder(order: OrderDoc & { userId?: unknown }) {
  const plain = JSON.parse(JSON.stringify(order))
  return plain as Omit<OrderDoc, '_id' | 'userId'> & {
    _id: string
    userId: string | { _id: string; name?: string; email?: string; phone?: string; rollNo?: string }
  }
}
