import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/**
 * A committee member who collects UPI payments on MASCOM's behalf.
 *
 * There is no merchant gateway, so a student pays a *person*: they pick a
 * recipient at checkout, scan that recipient's QR, and upload proof. The order
 * is then routed to that same recipient's verification queue, and only they
 * (or an admin) can confirm the money actually landed.
 */
const PaymentRecipientSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    upiId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    /** The user account that verifies payments made to this recipient. */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  { timestamps: true },
)

export type PaymentRecipientDoc = InferSchemaType<typeof PaymentRecipientSchema> & {
  _id: mongoose.Types.ObjectId
}

export const PaymentRecipient: Model<PaymentRecipientDoc> =
  (mongoose.models.PaymentRecipient as Model<PaymentRecipientDoc>) ??
  mongoose.model<PaymentRecipientDoc>('PaymentRecipient', PaymentRecipientSchema)
