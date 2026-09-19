// Local verification only — seeds the in-memory database with a realistic drop.
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

await mongoose.connect('mongodb://127.0.0.1:47017/mascom')
const db = mongoose.connection.db

const hash = await bcrypt.hash('Sonowal@1134', 12)
const users = [
  { name: 'Mrigankar Sonowal', email: 'mrigankars.mbaba04@iimamritsar.ac.in', isAdmin: true, rollNo: 'MBA04-112', section: 'B', hostel: 'H3', block: 'A', roomNo: '204', phone: '9876543210' },
  { name: 'Charu Jain', email: 'charu.mbaba04@iimamritsar.ac.in', isRecipient: true, rollNo: 'MBA04-021', section: 'A' },
  { name: 'Sanju Jain', email: 'sanju.mbaba04@iimamritsar.ac.in', isRecipient: true, rollNo: 'MBA04-044', section: 'B' },
  { name: 'Hrishikesh Das', email: 'hrishikesh.mbaba04@iimamritsar.ac.in', isModerator: true, rollNo: 'MBA04-058' },
  { name: 'Ananya Rao', email: 'ananya.mbaba05@iimamritsar.ac.in', rollNo: 'MBA05-009', section: 'C', hostel: 'H1', roomNo: '112', phone: '9812345670' },
  { name: 'Rohit Menon', email: 'rohit.mbaba05@iimamritsar.ac.in', rollNo: 'MBA05-031', section: 'A', hostel: 'H2', roomNo: '308', phone: '9801234567' },
]
const userDocs = users.map((u) => ({
  ...u, passwordHash: hash, roles: ['student'], userType: 'Student',
  isAdmin: !!u.isAdmin, isModerator: !!u.isModerator, isRecipient: !!u.isRecipient,
  logs: [], createdAt: new Date(), updatedAt: new Date(), lastLogin: new Date(),
}))
const { insertedIds: userIds } = await db.collection('users').insertMany(userDocs)

const now = new Date()
const products = [
  {
    productId: 'MASPOLO26', name: 'Batch Polo 2026', slug: 'batch-polo-2026',
    description: 'Premium-feel collar, clean chest print, and a batch-ready finish.\n220 GSM cotton piqué, pre-shrunk, with your name on the back if you want it.',
    price: 749, available: true, isLive: true, category: 'Apparel', material: 'Cotton piqué',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], allowCustomName: true,
    variants: [
      { color: 'White', imageUrls: ['/gallery/Last Year Drops/Batch T-Shirt.jpeg'] },
      { color: 'Lavender', imageUrls: ['/gallery/Last Year Drops/Varsity(Lavender)-Winter Merch.jpeg'] },
      { color: 'Maroon', imageUrls: ['/gallery/Last Year Drops/Varsity(Maroon)-Winter Merch.jpeg'] },
    ],
    salesHistory: [{ _id: new mongoose.Types.ObjectId(), price: 749, unitsSold: 34, date: now, note: '1st Batch' }],
    totalSold: 34, totalRevenue: 25466, likes: 48, hasBatchAssignment: false,
    createdAt: now, updatedAt: now,
  },
  {
    productId: 'MASHOOD26', name: 'Winter Hoodie', slug: 'winter-hoodie',
    description: 'Heavyweight fleece hoodie with the committee crest on the chest.',
    price: 1299, available: true, isLive: true, category: 'Apparel', material: 'Fleece',
    availableSizes: ['S', 'M', 'L', 'XL'], allowCustomName: false,
    variants: [
      { color: 'Black', imageUrls: ['/gallery/Last Year Drops/Hoodie(Black)-Winter Merch.jpeg'] },
      { color: 'Green', imageUrls: ['/gallery/Last Year Drops/Hoodie(Green) - Winter Merch.jpeg'] },
    ],
    salesHistory: [{ _id: new mongoose.Types.ObjectId(), price: 1299, unitsSold: 18, date: now, note: '1st Batch' }],
    totalSold: 18, totalRevenue: 23382, likes: 31, createdAt: now, updatedAt: now,
  },
  {
    productId: 'MASKIT26', name: 'Essential Kit', slug: 'essential-kit',
    description: 'Bottle, lanyard, sticker set and tote — the starter pack for the batch.',
    price: 499, available: false, isLive: true, category: 'Accessories', material: 'Mixed',
    availableSizes: [], allowCustomName: false,
    variants: [{ color: 'Beige', imageUrls: ['/gallery/Last Year Drops/Essential Kit.jpeg'] }],
    salesHistory: [{ _id: new mongoose.Types.ObjectId(), price: 499, unitsSold: 62, date: now, note: '1st Batch' }],
    totalSold: 62, totalRevenue: 30938, likes: 22, createdAt: now, updatedAt: now,
  },
]
const { insertedIds: productIds } = await db.collection('products').insertMany(products)

const recipients = [
  { name: 'Charu Jain', upiId: 'charujain@okaxis', phoneNumber: '9876500011', qrCodeUrl: '', userId: userIds[1], isActive: true, description: 'Sections A & B', createdAt: now, updatedAt: now },
  { name: 'Sanju Jain', upiId: 'sanju.jain@okhdfcbank', phoneNumber: '9876500022', qrCodeUrl: '', userId: userIds[2], isActive: true, description: 'Sections C & D', createdAt: now, updatedAt: now },
]
const { insertedIds: recipientIds } = await db.collection('paymentrecipients').insertMany(recipients)

function makeOrder(n, userIdx, recipientIdx, paymentStatus, status, daysAgo, productIdx, qty, size, color, custom) {
  const placed = new Date(Date.now() - daysAgo * 86400000)
  const product = products[productIdx]
  const band = product.salesHistory[0]
  const amount = product.price * qty
  return {
    orderId: `ORD${String(n).padStart(5, '0')}`,
    userId: userIds[userIdx], orderDate: placed, status,
    items: [{
      _id: new mongoose.Types.ObjectId(),
      productId: productIds[productIdx], salesHistoryId: band._id,
      productSnapshot: { name: product.name, description: product.description, image: product.variants[0].imageUrls[0], category: product.category, variants: product.variants, availableSizes: product.availableSizes },
      variant: { color, size, selectedImage: product.variants.find((v) => v.color === color)?.imageUrls[0] ?? product.variants[0].imageUrls[0], availableColors: product.variants.map((v) => v.color), availableSizes: product.availableSizes },
      quantity: qty, customName: custom, unitPrice: product.price, batchNote: '1st Batch',
      batchNumber: paymentStatus === 'Paid' ? 'B-01' : 'WAITING',
      itemStatus: status === 'Delivered' ? 'Delivered' : paymentStatus === 'Paid' ? 'Confirmed' : paymentStatus === 'Failed' ? 'Failed' : 'Verification Pending',
      statusHistory: [{ status: 'Verification Pending', timestamp: placed }], waitingSince: placed,
    }],
    totalAmount: amount, discountAmount: 0, finalAmountPaid: amount,
    paymentStatus, paymentConfirmed: paymentStatus === 'Paid',
    paymentRecipientId: recipientIds[recipientIdx], paidTo: recipients[recipientIdx].name,
    screenshotUrl: '/gallery/Distribution/Collection Day.jpeg',
    paymentReference: `4${Math.floor(10000000000 + Math.random() * 80000000000)}`,
    verificationMethod: 'Screenshot', riskScore: 0, fraudFlags: [], isFraudFlagged: false,
    createdAt: placed, updatedAt: placed,
  }
}

await db.collection('orders').insertMany([
  makeOrder(1, 4, 0, 'Pending', 'Verification Pending', 0, 0, 1, 'M', 'White', 'ANANYA'),
  makeOrder(2, 5, 0, 'Pending', 'Verification Pending', 0, 1, 1, 'L', 'Black'),
  makeOrder(3, 4, 1, 'Pending', 'Verification Pending', 1, 0, 2, 'S', 'Lavender'),
  makeOrder(4, 5, 0, 'Paid', 'Confirmed', 2, 0, 1, 'XL', 'Maroon', 'ROHIT'),
  makeOrder(5, 4, 1, 'Paid', 'Processing', 4, 1, 1, 'M', 'Green'),
  makeOrder(6, 5, 0, 'Paid', 'Delivered', 7, 2, 1),
  makeOrder(7, 4, 0, 'Failed', 'Failed', 9, 0, 1, 'L', 'White'),
  makeOrder(8, 5, 1, 'Paid', 'Confirmed', 11, 0, 3, 'M', 'White'),
])

console.log('SEEDED')
await mongoose.disconnect()
