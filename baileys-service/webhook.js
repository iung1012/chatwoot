import express from 'express'

export function startWebhookServer(sock) {
  const app = express()
  app.use(express.json())

  app.post('/webhook', async (req, res) => {
    res.sendStatus(200)

    const { event, message_type, content, conversation } = req.body

    // Chatwoot envia message_type como string: 'outgoing' = agente respondeu
    if (event !== 'message_created' || message_type !== 'outgoing') return
    if (!content?.trim()) return

    const phone = conversation?.meta?.sender?.phone_number?.replace(/\D/g, '')
    if (!phone) return

    try {
      await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: content })
      console.log(`📤 [${phone}] ← Agente: "${content.substring(0, 60)}"`)
    } catch (err) {
      console.error(`Erro ao enviar para +${phone}:`, err.message)
    }
  })

  const port = process.env.WEBHOOK_PORT || 3001
  app.listen(port, '0.0.0.0', () =>
    console.log(`🔗 Webhook ouvindo em http://0.0.0.0:${port}/webhook`)
  )
}
