import axios from 'axios'

const api = axios.create({
  baseURL: `${process.env.CHATWOOT_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`,
  headers: { api_access_token: process.env.CHATWOOT_API_TOKEN },
})

// cache em memória: phone -> conversation_id
const convCache = new Map()

export async function forwardToChatwoot({ phone, name, text }) {
  try {
    const contact = await getOrCreateContact(phone, name)
    const convId = await getOrCreateConversation(contact.id, phone)
    await api.post(`/conversations/${convId}/messages`, {
      content: text,
      message_type: 'incoming',
      private: false,
    })
    console.log(`📥 [${phone}] → Chatwoot: "${text.substring(0, 60)}"`)
  } catch (err) {
    console.error('Erro ao encaminhar para Chatwoot:', err.response?.data ?? err.message)
  }
}

async function getOrCreateContact(phone, name) {
  const res = await api.get(`/contacts/search?q=%2B${phone}&page=1`)
  const contacts = res.data.payload ?? []
  const existing = contacts.find(c => c.phone_number?.replace(/\D/g, '').endsWith(phone))
  if (existing) return existing

  const created = await api.post('/contacts', {
    name: name || `+${phone}`,
    phone_number: `+${phone}`,
  })
  return created.data
}

async function getOrCreateConversation(contactId, phone) {
  if (convCache.has(phone)) return convCache.get(phone)

  const res = await api.get(`/contacts/${contactId}/conversations`)
  const conversations = res.data.payload ?? []
  const inboxId = parseInt(process.env.CHATWOOT_INBOX_ID)

  const existing = conversations.find(
    c => c.inbox_id === inboxId && c.status !== 'resolved'
  )

  if (existing) {
    convCache.set(phone, existing.id)
    return existing.id
  }

  const conv = await api.post('/conversations', {
    contact_id: contactId,
    inbox_id: inboxId,
  })

  convCache.set(phone, conv.data.id)
  return conv.data.id
}
