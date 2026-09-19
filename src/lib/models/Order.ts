import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { ITEM_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants'

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  salesHistoryId: { type: Schema.Types.ObjectId, required: true },

  // Frozen copy of the product as it was when ordered, so later edits to the
  // catalogue never rewrite someone's order history.
  productSnapshot: {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: String },
    variants: [{ color: String, imageUrls: [String] }],
    availableSizes: [String],
  },

  variant: {
    color: String,
    size: String,
    selectedImage: String,
    availableColors: [String],
    availableSizes: [String],
  },

  quantity: { type: Number, required: true },
  customName: { type: String },
  unitPrice: { type: Number, required: true },
  batchNote: { type: String },

  batchNumber: { type: String, default: 'WAITING' },
  itemStatus: { type: String, enum: ITEM_STATUSES, default: 'Verification Pending' },

  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String },
    },
  ],

  fulfilledAt: { type: Date },
  itemNote: { type: String },
  waitingSince: { type: Date, default: Date.now },
})

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ORDER_STATUSES, default: 'Verification Pending' },

    items: [OrderItemSchema],

    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmountPaid: { type: Number, required: true },

    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Pending', index: true },
    batchNote: { type: String },

    // ── Person-to-person payment trail ──────────────────────────────────
    /** Recipient the student chose to pay; also decides who verifies. */
    paymentRecipientId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRecipient',
      index: true,
    },
    /** Denormalised recipient name, kept for historical orders. */
    paidTo: { type: String },
    /** Uploaded proof of payment (UPI app screenshot). */
    screenshotUrl: { type: String },
    /** UPI reference / UTR the student typed in, for matching statements. */
    paymentReference: { type: String },
    paymentConfirmed: { type: Boolean, default: false },

    couponCodeUsed: { type: String },
    isFraudFlagged: { type: Boolean, default: false },
    adminOverride: { type: Boolean, default: false },

    ipAddress: { type: String },
    userAgent: { type: String },
    locationData: { type: Schema.Types.Mixed },
    riskScore: { type: Number, default: 0 },
    fraudFlags: [{ type: String }],

    verificationMethod: {
      type: String,
      enum: ['Screenshot', 'Admin', 'Auto', 'Pending'],
      default: 'Screenshot',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationDate: { type: Date },
    verificationNotes: { type: String },
  },
  { timestamps: true },
)

OrderSchema.index({ createdAt: -1 })

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId }

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ?? mongoose.model<OrderDoc>('Order', OrderSchema)
