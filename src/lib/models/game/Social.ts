import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/**
 * Friendships, the alarm each defender sets for the day, and the record of what friend raids
 * actually moved. Encounters are the honest history: who raided whom, and the real amount.
 */
const FriendshipSchema = new Schema(
  {
    /** Sorted "a:b" user ids, so a pair can only exist once whichever way round it was made. */
    pairKey: { type: String, required: true, unique: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addresseeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    state: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
)

FriendshipSchema.index({ requesterId: 1, state: 1 })
FriendshipSchema.index({ addresseeId: 1, state: 1 })

export type FriendshipDoc = InferSchemaType<typeof FriendshipSchema> & { _id: mongoose.Types.ObjectId }

export const Friendship: Model<FriendshipDoc> =
  (mongoose.models.Friendship as Model<FriendshipDoc>) ??
  mongoose.model<FriendshipDoc>('Friendship', FriendshipSchema)

/** Where a defender hid their alarm for a campus day. Set once, then locked for the day. */
const VaultConfigSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campusDate: { type: String, required: true },
    alarmSlot: { type: Number, required: true, min: 0, max: 2 },
  },
  { timestamps: true },
)

VaultConfigSchema.index({ userId: 1, campusDate: 1 }, { unique: true })

export type VaultConfigDoc = InferSchemaType<typeof VaultConfigSchema> & { _id: mongoose.Types.ObjectId }

export const VaultConfig: Model<VaultConfigDoc> =
  (mongoose.models.VaultConfig as Model<VaultConfigDoc>) ??
  mongoose.model<VaultConfigDoc>('VaultConfig', VaultConfigSchema)

/** One settled friend raid: the ledger entry both players see in their recent encounters. */
const EncounterSchema = new Schema(
  {
    raidId: { type: Schema.Types.ObjectId, ref: 'Raid', required: true, unique: true },
    attackerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defenderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    outcome: { type: String, enum: ['escaped', 'caught', 'timeout'], required: true },
    campusDate: { type: String, required: true },
    reaction: { type: String, maxlength: 24 },
  },
  { timestamps: true },
)

EncounterSchema.index({ attackerId: 1, createdAt: -1 })
EncounterSchema.index({ defenderId: 1, createdAt: -1 })

export type EncounterDoc = InferSchemaType<typeof EncounterSchema> & { _id: mongoose.Types.ObjectId }

export const Encounter: Model<EncounterDoc> =
  (mongoose.models.Encounter as Model<EncounterDoc>) ??
  mongoose.model<EncounterDoc>('Encounter', EncounterSchema)
