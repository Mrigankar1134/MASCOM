import { MongoMemoryServer } from 'mongodb-memory-server'
const mongo = await MongoMemoryServer.create({ instance: { port: 47017, dbName: 'mascom' } })
console.log('MONGO READY', mongo.getUri('mascom'))
process.on('SIGTERM', async () => { await mongo.stop(); process.exit(0) })
setInterval(() => {}, 1 << 30)
