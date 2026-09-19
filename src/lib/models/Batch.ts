import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/** A production run: every order placed between the two dates ships together. */
const BatchSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    batchNumber: { type: String, required: true, unique: true },
    orderStartDate: { type: Date, required: true },
    orderEndDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

export type BatchDoc = InferSchemaType<typeof BatchSchema> & { _id: mongoose.Types.ObjectId }

export const Batch: Model<BatchDoc> =
  (mongoose.models.Batch as Model<BatchDoc>) ?? mongoose.model<BatchDoc>('Batch', BatchSchema)
