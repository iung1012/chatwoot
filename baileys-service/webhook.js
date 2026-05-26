import instanceManager from './instance-manager.js'

export function registerWebhook(app) {
  app.post('/webhook', async (req, res) => {
    res.sendStatus(200)

    const { event, message_type, content, conversation } = req.body
    if (event !== 'message_created' || message_type !== 'outgoing') return
    if (!content?.trim()) return

    const instance = instanceManager.getByInboxId(conversation?.inbox_id)
    if (!instance || instance.status !== 'connected') return

    const phone = conversation?.meta?.sender?.phone_number?.replace(/\D/g, '')
    if (!phone) return

    try {
      await instance.sock.sendMessage(`${phone}@s.whatsapp.net`, { text: content })
      console.log(`📤 [conta:${instance.accountId}] +${phone}: "${content.substring(0, 60)}"`)
    } catch (err) {
      console.error(`Erro ao enviar para +${phone}:`, err.message)
    }
  })
}
