import 'dotenv/config'
import express from 'express'
import instanceManager from './instance-manager.js'
import { registerWebhook } from './webhook.js'
import apiRouter from './api.js'

const app = express()
app.use(express.json())

registerWebhook(app)
app.use('/api', apiRouter)

const port = process.env.WEBHOOK_PORT || 3001
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Baileys Service na porta ${port}`)
  await instanceManager.loadPersisted()
})
