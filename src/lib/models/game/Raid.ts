import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { RULES_VERSION } from '@/lib/game/rules'

/**
 * A single raid. This collection is private: `alarmSlot` is the hidden layout and is never sent
 * to the attacker, only the result of a door they have already opened.
 *
 * Partial unique indexes keep one active raid per attacker, and one incoming friend raid per
 * defender, so reservations can't pile up on the same person.
 */
const RaidSchema = new Schema(
  {
    mode: { type: String, enum: ['ranked', 'friend', 'event'], required: true },
    attackerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defenderId: { type: Schema.Types.ObjectId, ref: 'User' },

    /** The hidden layout. Server-only. */
    alarmSlot: { type: Number, required: true, min: 0, max: 2 },
    openedDoors: [{ type: Number, min: 0, max: 2 }],

    phase: { type: String, enum: ['active', 'decision', 'settled'], default: 'active' },
    /** Loot on the table if the attacker escapes now. */
    provisional: { type: Number, default: 0 },
    settledAmount: { type: Number },
    /** For friend raids: the 80/180 the doors were worth, before the defender's cap applied. */
    nominalAmount: { type: Number },
    outcome: { type: String, enum: ['escaped', 'caught', 'timeout'] },

    /** Coins held aside from the defender for a friend raid, paid or released on settlement. */
    reservedAmount: { type: Number, default: 0 },
    rewardCap: { type: Number },

    campusDate: { type: String, required: true },
    weekId: { type: String, required: true },
    crewId: { type: Schema.Types.ObjectId, ref: 'Crew' },

    /** Bumped on every accepted command, so a stale client can't replay an old step. */
    version: { type: Number, default: 0 },
    /** Repeat of the same request returns the same raid instead of starting another. */
    idempotencyKey: { type: String },
    rulesVersion: { type: Number, default: RULES_VERSION },
    expiresAt: { type: Date, required: true },
    settledAt: { type: Date },
  },
  { timestamps: true },
)

RaidSchema.index({ attackerId: 1, phase: 1 }, { unique: true, partialFilterExpression: { phase: { $in: ['active', 'decision'] } } })
RaidSchema.index(
  { defenderId: 1, mode: 1, phase: 1 },
  { unique: true, partialFilterExpression: { mode: 'friend', phase: { $in: ['active', 'decision'] } } },
)
RaidSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true })
RaidSchema.index({ attackerId: 1, createdAt: -1 })
RaidSchema.index({ defenderId: 1, settledAt: -1 })

export type RaidDoc = InferSchemaType<typeof RaidSchema> & { _id: mongoose.Types.ObjectId }

export const Raid: Model<RaidDoc> =
  (mongoose.models.Raid as Model<RaidDoc>) ?? mongoose.model<RaidDoc>('Raid', RaidSchema)
