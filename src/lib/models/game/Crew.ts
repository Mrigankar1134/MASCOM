import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { CREW_SIZE } from '@/lib/game/rules'

/**
 * A crew for one Friday Big Heist. Exactly three members from any cohort, joined with a short
 * code, locked when the event starts. One crew per person per event, enforced by a unique index
 * on (eventId, member).
 *
 * Crew scores come from the event raids themselves, so nothing here needs to be kept in step.
 */
const CrewSchema = new Schema(
  {
    /** The week the event belongs to, e.g. "2026-W39". */
    eventId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 24 },
    code: { type: String, required: true, uppercase: true, trim: true },
    captainId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: [(v: unknown[]) => v.length <= CREW_SIZE, `A crew holds at most ${CREW_SIZE} members.`],
    },
  },
  { timestamps: true },
)

CrewSchema.index({ eventId: 1, code: 1 }, { unique: true })
CrewSchema.index({ eventId: 1, memberIds: 1 }, { unique: true })

export type CrewDoc = InferSchemaType<typeof CrewSchema> & { _id: mongoose.Types.ObjectId }

export const Crew: Model<CrewDoc> =
  (mongoose.models.Crew as Model<CrewDoc>) ?? mongoose.model<CrewDoc>('Crew', CrewSchema)
