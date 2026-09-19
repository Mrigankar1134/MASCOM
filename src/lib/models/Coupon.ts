import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['Percentage', 'Fixed'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },

    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    accessType: { type: String, enum: ['Public', 'UserSpecific'], default: 'Public' },

    active: { type: Boolean, default: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

CouponSchema.index({ code: 1, active: 1 })
CouponSchema.index({ validFrom: 1, validUntil: 1 })

export type CouponDoc = InferSchemaType<typeof CouponSchema> & { _id: mongoose.Types.ObjectId }

export const Coupon: Model<CouponDoc> =
  (mongoose.models.Coupon as Model<CouponDoc>) ??
  mongoose.model<CouponDoc>('Coupon', CouponSchema)
