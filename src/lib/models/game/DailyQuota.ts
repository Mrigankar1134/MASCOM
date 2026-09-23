import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/**
 * One row per player per campus day: how many attempts they have spent, and how much of their
 * social stash is exposed to incoming friend raids that day.
 *
 * Every counter here is moved with a conditional `findOneAndUpdate`, which is atomic in MongoDB
 * even without transactions: two raids starting at once cannot both take the last attempt.
 */
const DailyQuotaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campusDate: { type: String, required: true },

    rankedUsed: { type: Number, default: 0, min: 0 },
    socialUsed: { type: Number, default: 0, min: 0 },
    eventUsed: { type: Number, default: 0, min: 0 },

    /** Coins already lost today, and coins held by raids still in progress. */
    exposureUsed: { type: Number, default: 0, min: 0 },
    exposureReserved: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

DailyQuotaSchema.index({ userId: 1, campusDate: 1 }, { unique: true })

export type DailyQuotaDoc = InferSchemaType<typeof DailyQuotaSchema> & { _id: mongoose.Types.ObjectId }

export const DailyQuota: Model<DailyQuotaDoc> =
  (mongoose.models.DailyQuota as Model<DailyQuotaDoc>) ??
  mongoose.model<DailyQuotaDoc>('DailyQuota', DailyQuotaSchema)
