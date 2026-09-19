import mongoose from 'mongoose'

/**
 * A single cached connection shared across hot reloads and serverless
 * invocations — Next.js re-evaluates modules far more often than a long-lived
 * Express process did, so without this we would open a connection per request.
 */
declare global {
  var __mascomMongoose:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined
}

const cached = global.__mascomMongoose ?? { conn: null, promise: null }
global.__mascomMongoose = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}
