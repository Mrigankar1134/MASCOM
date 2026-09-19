import { z } from 'zod'
import { ITEM_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128)
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
  rollNo: z.string().trim().max(32).optional(),
  section: z.string().trim().max(8).optional(),
  phone: z.string().trim().max(20).optional(),
})

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  rollNo: z.string().trim().max(32).optional().or(z.literal('')),
  section: z.string().trim().max(8).optional().or(z.literal('')),
  hostel: z.string().trim().max(40).optional().or(z.literal('')),
  block: z.string().trim().max(20).optional().or(z.literal('')),
  roomNo: z.string().trim().max(20).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  profilePicUrl: z.string().max(500).optional().or(z.literal('')),
})

export const orderItemInput = z.object({
  productId: objectId,
  quantity: z.number().int().min(1).max(20),
  color: z.string().trim().max(40).optional(),
  size: z.string().trim().max(16).optional(),
  customName: z.string().trim().max(24).optional(),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemInput).min(1, 'Your bag is empty'),
  paymentRecipientId: objectId,
  screenshotUrl: z.string().min(1, 'Upload your payment screenshot').max(2_000_000),
  paymentReference: z.string().trim().max(40).optional(),
  couponCode: z.string().trim().max(32).optional(),
})

export const recipientSchema = z.object({
  name: z.string().trim().min(2).max(60),
  upiId: z
    .string()
    .trim()
    .regex(/^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/, 'Enter a valid UPI ID, e.g. name@okaxis'),
  phoneNumber: z.string().trim().regex(/^[\d\s+\-]{6,20}$/, 'Enter a valid phone number'),
  qrCodeUrl: z.string().min(1, 'Upload the payment QR'),
  userId: objectId,
  description: z.string().trim().max(160).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export const updateRecipientSchema = recipientSchema.partial().extend({
  userId: objectId.optional(),
})

export const verifyPaymentSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
  notes: z.string().trim().max(300).optional(),
})

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  batchNote: z.string().trim().max(120).optional(),
  adminOverride: z.boolean().optional(),
})

export const updateItemSchema = z.object({
  itemStatus: z.enum(ITEM_STATUSES),
  batchNumber: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(300).optional(),
  adminOverride: z.boolean().optional(),
})

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  price: z.number().min(0).max(1_000_000),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  subCategory: z.string().trim().max(60).optional().or(z.literal('')),
  material: z.string().trim().max(60).optional().or(z.literal('')),
  availableSizes: z.array(z.string().trim().max(16)).max(20).optional(),
  allowCustomName: z.boolean().optional(),
  available: z.boolean().optional(),
  isLive: z.boolean().optional(),
  launchTime: z.string().datetime().optional().or(z.literal('')),
  variants: z
    .array(
      z.object({
        color: z.string().trim().min(1).max(40),
        imageUrls: z.array(z.string().min(1)).max(8),
      }),
    )
    .max(12)
    .optional(),
})

export const roleSchema = z.object({
  isAdmin: z.boolean().optional(),
  isModerator: z.boolean().optional(),
  isRecipient: z.boolean().optional(),
})

export const batchSchema = z.object({
  productId: objectId,
  batchNumber: z.string().trim().min(1).max(40),
  orderStartDate: z.string().min(1),
  orderEndDate: z.string().min(1),
})
