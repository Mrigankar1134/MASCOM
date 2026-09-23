import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/** A player's ranked total for one week. Only settled ranked loot lands here; it is never stolen. */
const WeeklyScoreSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekId: { type: String, required: true },
    points: { type: Number, default: 0, min: 0 },
    attempts: { type: Number, default: 0, min: 0 },
    escapes: { type: Number, default: 0, min: 0 },
    caught: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

WeeklyScoreSchema.index({ userId: 1, weekId: 1 }, { unique: true })
WeeklyScoreSchema.index({ weekId: 1, points: -1 })

export type WeeklyScoreDoc = InferSchemaType<typeof WeeklyScoreSchema> & { _id: mongoose.Types.ObjectId }

export const WeeklyScore: Model<WeeklyScoreDoc> =
  (mongoose.models.WeeklyScore as Model<WeeklyScoreDoc>) ??
  mongoose.model<WeeklyScoreDoc>('WeeklyScore', WeeklyScoreSchema)
