import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { requireUser, route } from '@/lib/api-helpers'
import { isStaff } from '@/lib/auth'
import { PaymentRecipient } from '@/lib/models/PaymentRecipient'

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  // Neutralise formula injection before Excel gets hold of the file.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

/**
 * One row per order line — the shape the fulfilment team actually packs from.
 */
export const GET = route(async (req) => {
  const user = await requireUser('console')
  await connectDB()

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const filter: Record<string, unknown> = {}
  if (!isStaff(user)) {
    const mine = await PaymentRecipient.findOne({ userId: user._id }).lean()
    filter.paymentRecipientId = mine?._id ?? null
  }
  if (status && status !== 'all') filter.paymentStatus = status

  const orders = await Order.find(filter)
    .populate('userId', 'name email phone rollNo section hostel block roomNo')
    .sort({ createdAt: -1 })
    .lean()

  const headerRow = [
    'Order ID', 'Placed', 'Student', 'Email', 'Roll no', 'Section', 'Phone', 'Hostel', 'Room',
    'Product', 'Colour', 'Size', 'Custom name', 'Qty', 'Unit price', 'Line total',
    'Batch', 'Item status', 'Order status', 'Payment status', 'Paid to', 'Reference',
  ]

  const rows: string[] = [headerRow.map(csvCell).join(',')]

  for (const order of orders) {
    const student = order.userId as unknown as Record<string, string> | null
    for (const item of order.items) {
      rows.push(
        [
          order.orderId,
          new Date(order.createdAt).toISOString(),
          student?.name, student?.email, student?.rollNo, student?.section, student?.phone,
          student?.hostel, [student?.block, student?.roomNo].filter(Boolean).join(' '),
          item.productSnapshot?.name, item.variant?.color, item.variant?.size, item.customName,
          item.quantity, item.unitPrice, item.unitPrice * item.quantity,
          item.batchNumber, item.itemStatus,
          order.status, order.paymentStatus, order.paidTo, order.paymentReference,
        ].map(csvCell).join(','),
      )
    }
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mascom-orders-${stamp}.csv"`,
    },
  })
})
