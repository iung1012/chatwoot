import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import pino from 'pino'
import { forwardToChatwoot } from './chatwoot.js'

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_state')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  })

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 Escaneie o QR Code com o WhatsApp:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(`Conexão encerrada (código ${code}). Reconectando: ${shouldReconnect}`)
      if (shouldReconnect) startWhatsApp()
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp conectado!')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message) continue

      const jid = msg.key.remoteJid
      if (!jid || jid.endsWith('@g.us')) continue // ignora grupos

      const phone = jid.replace('@s.whatsapp.net', '')
      const name = msg.pushName || phone
      const text = extractText(msg.message)

      if (!text) continue

      await forwardToChatwoot({ phone, name, text })
    }
  })

  return sock
}

function extractText(message) {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    null
  )
}
