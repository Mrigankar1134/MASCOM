import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

/**
 * Mirrors the existing `users` collection field for field so the rebuild can
 * read and write the live database with no migration.
 */
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: { type: [String], default: ['student'] },

    profilePicUrl: { type: String },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    userType: { type: String, enum: ['Student', 'Faculty', 'Staff'], default: 'Student' },

    rollNo: { type: String },
    section: { type: String },
    hostel: { type: String },
    block: { type: String },
    roomNo: { type: String },

    isAdmin: { type: Boolean, default: false },
    isModerator: { type: Boolean, default: false },
    isRecipient: { type: Boolean, default: false },

    logs: {
      type: [
        {
          action: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
          metadata: { type: Schema.Types.Mixed },
        },
      ],
      default: [],
    },

    lastLogin: { type: Date },
  },
  { timestamps: true },
)

UserSchema.pre('save', function (next) {
  // Keep the audit trail bounded without reassigning the document array.
  if (this.logs && this.logs.length > 30) this.logs.splice(0, this.logs.length - 30)
  next()
})

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId }

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>('User', UserSchema)
