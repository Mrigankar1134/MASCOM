export const ORDER_STATUSES = [
  'Verification Pending',
  'Confirmed',
  'Processing',
  'Partially Fulfilled',
  'Delivered',
  'Failed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ITEM_STATUSES = [
  'Verification Pending',
  'Confirmed',
  'Processing',
  'Delivered',
  'Failed',
  'Waiting for Inventory',
] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const ROLES = ['student', 'recipient', 'moderator', 'admin'] as const
export type Role = (typeof ROLES)[number]

/** Tone used by badges and status pills across shop and admin. */
export const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  Paid: 'ok',
  Confirmed: 'ok',
  Delivered: 'ok',
  Pending: 'warn',
  'Verification Pending': 'warn',
  'Waiting for Inventory': 'warn',
  Processing: 'info',
  'Partially Fulfilled': 'info',
  Failed: 'danger',
}

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
