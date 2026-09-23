import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { COHORTS, WEEKLY_STASH } from '@/lib/game/rules'

/**
 * A player's Campus Heist identity, kept apart from the shop account: an alias other students
 * see, their cohort filter, whether they take part in friend raids, and their social stash.
 *
 * `stashWeek` records which week the balance belongs to; it is topped back up to the weekly seed
 * the first time a player is seen in a new week.
 */
const GameProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    alias: { type: String, required: true, trim: true, maxlength: 24 },
    cohort: { type: String, enum: COHORTS, required: true },
    socialOptIn: { type: Boolean, default: true },

    socialBalance: { type: Number, default: WEEKLY_STASH, min: 0 },
    /** Coins currently held aside by incoming friend raids that have not settled yet. */
    socialReserved: { type: Number, default: 0, min: 0 },
    stashWeek: { type: String, default: '' },

    blocked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastPlayedAt: { type: Date },
  },
  { timestamps: true },
)

export type GameProfileDoc = InferSchemaType<typeof GameProfileSchema> & { _id: mongoose.Types.ObjectId }

export const GameProfile: Model<GameProfileDoc> =
  (mongoose.models.GameProfile as Model<GameProfileDoc>) ??
  mongoose.model<GameProfileDoc>('GameProfile', GameProfileSchema)
