import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { forwardToChatwoot } from './chatwoot.js'

const INSTANCES_FILE = './data/instances.json'

class InstanceManager {
  constructor() {
    // name -> { name, inboxId, accountId, token, status, qrCode, sock }
    this.instances = new Map()
  }

  async loadPersisted() {
    try {
      const raw = await readFile(INSTANCES_FILE, 'utf8')
      const list = JSON.parse(raw)
      console.log(`Carregando ${list.length} instância(s) persistida(s)...`)
      for (const inst of list) {
        await this.create(inst).catch(e => console.error(`Erro ao restaurar ${inst.name}:`, e.message))
      }
    } catch {
      // sem arquivo ainda, ok
    }
  }

  async persist() {
    await mkdir('./data', { recursive: true })
    const list = Array.from(this.instances.values()).map(({ name, inboxId, accountId, token }) => ({
      name, inboxId, accountId, token,
    }))
    await writeFile(INSTANCES_FILE, JSON.stringify(list, null, 2))
  }

  async create({ name, inboxId, accountId, token }) {
    if (this.instances.has(name)) throw new Error(`Instância "${name}" já existe`)

    const instance = { name, inboxId: parseInt(inboxId), accountId, token, status: 'connecting', qrCode: null, sock: null }
    this.instances.set(name, instance)
    await this.persist()
    await this._connect(name)
    return instance
  }

  async remove(name) {
    const instance = this.instances.get(name)
    if (!instance) throw new Error(`Instância "${name}" não encontrada`)
    try { instance.sock?.end() } catch {}
    this.instances.delete(name)
    await this.persist()
  }

  get(name) {
    return this.instances.get(name) ?? null
  }

  getByInboxId(inboxId) {
    for (const inst of this.instances.values()) {
      if (inst.inboxId === parseInt(inboxId)) return inst
    }
    return null
  }

  list() {
    return Array.from(this.instances.values()).map(({ name, inboxId, accountId, status }) => ({
      name, inboxId, accountId, status,
    }))
  }

  async _connect(name) {
    const instance = this.instances.get(name)
    if (!instance) return

    const authDir = `./auth_state/${name}`
    await mkdir(authDir, { recursive: true })
    const { state, saveCreds } = await useMultiFileAuthState(authDir)

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
    })

    instance.sock = sock

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      const inst = this.instances.get(name)
      if (!inst) return

      if (qr) {
        inst.status = 'qr_pending'
        inst.qrCode = await qrcode.toDataURL(qr)
        console.log(`[${name}] QR Code gerado`)
      }

      if (connection === 'close') {
        inst.status = 'disconnected'
        inst.qrCode = null
        const code = lastDisconnect?.error?.output?.statusCode
        if (code !== DisconnectReason.loggedOut) {
          console.log(`[${name}] Reconectando...`)
          setTimeout(() => this._connect(name), 3000)
        } else {
          console.log(`[${name}] Deslogado — escaneie o QR novamente`)
        }
      }

      if (connection === 'open') {
        inst.status = 'connected'
        inst.qrCode = null
        console.log(`[${name}] ✅ Conectado!`)
      }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      const inst = this.instances.get(name)
      if (!inst) return

      for (const msg of messages) {
        if (msg.key.fromMe || !msg.message) continue
        const jid = msg.key.remoteJid
        if (!jid || jid.endsWith('@g.us')) continue

        const phone = jid.replace('@s.whatsapp.net', '')
        const senderName = msg.pushName || phone
        const text = extractText(msg.message)
        if (!text) continue

        await forwardToChatwoot({
          phone, name: senderName, text,
          inboxId: inst.inboxId,
          accountId: inst.accountId,
          token: inst.token,
        })
      }
    })
  }
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

export default new InstanceManager()
