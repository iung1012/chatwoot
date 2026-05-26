import 'dotenv/config'
import { startWhatsApp } from './whatsapp.js'
import { startWebhookServer } from './webhook.js'

console.log('🚀 Iniciando Chatwoot Baileys Service...')

const sock = await startWhatsApp()
startWebhookServer(sock)
