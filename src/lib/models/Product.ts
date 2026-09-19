import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import slugify from 'slugify'

const VariantSchema = new Schema({
  color: { type: String, required: true, index: true },
  imageUrls: [{ type: String, required: true }],
})

const SalesHistorySchema = new Schema({
  price: { type: Number, required: true },
  unitsSold: { type: Number, required: true, default: 0 },
  date: { type: Date, default: Date.now },
  note: { type: String },
})

const ProductSchema = new Schema(
  {
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String },

    price: { type: Number, required: true },
    available: { type: Boolean, default: false },

    material: { type: String, index: true },
    capacity: { type: String, index: true },

    availableSizes: [{ type: String }],
    allowCustomName: { type: Boolean, default: false },
    category: { type: String, index: true },
    subCategory: { type: String },

    launchTime: { type: Date },
    isLive: { type: Boolean, default: false },
    timeRemaining: { type: Number, default: null },

    salesHistory: { type: [SalesHistorySchema], default: [] },
    totalRevenue: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },

    variants: { type: [VariantSchema], default: [] },
    hasBatchAssignment: { type: Boolean, default: false },
  },
  { timestamps: true },
)

ProductSchema.pre('save', function (next) {
  const now = new Date()

  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }

  if (this.launchTime && now >= this.launchTime) this.isLive = true

  if (!this.isLive) {
    this.timeRemaining = null
  } else if (this.launchTime) {
    const diff = new Date(this.launchTime).getTime() - now.getTime()
    this.timeRemaining = diff > 0 ? diff : 0
  }

  // Every product carries at least one price band so orders can pin the exact
  // price a student paid, even after the price later changes.
  if (this.isNew && (!this.salesHistory || this.salesHistory.length === 0)) {
    this.salesHistory.push({ price: this.price, unitsSold: 0, date: now, note: '1st Batch' })
  }

  this.totalRevenue = this.salesHistory.reduce((sum, r) => sum + r.price * r.unitsSold, 0)
  this.totalSold = this.salesHistory.reduce((sum, r) => sum + r.unitsSold, 0)

  next()
})

ProductSchema.index({ category: 1, material: 1, capacity: 1, 'variants.color': 1 })

export type ProductDoc = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ??
  mongoose.model<ProductDoc>('Product', ProductSchema)
