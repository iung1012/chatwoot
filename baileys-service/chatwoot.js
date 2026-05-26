import axios from 'axios'

const convCache = new Map() // `${accountId}:${phone}` -> conversationId

export async function forwardToChatwoot({ phone, name, text, inboxId, accountId, token }) {
  const api = createApi(accountId, token)
  try {
    const contact = await getOrCreateContact(api, phone, name)
    const convId = await getOrCreateConversation(api, contact.id, phone, inboxId, accountId)
    await api.post(`/conversations/${convId}/messages`, {
      content: text,
      message_type: 'incoming',
      private: false,
    })
    console.log(`📥 [conta:${accountId}] +${phone}: "${text.substring(0, 60)}"`)
  } catch (err) {
    console.error(`Erro conta ${accountId}:`, err.response?.data ?? err.message)
  }
}

function createApi(accountId, token) {
  return axios.create({
    baseURL: `${process.env.CHATWOOT_URL}/api/v1/accounts/${accountId}`,
    headers: { api_access_token: token },
  })
}

async function getOrCreateContact(api, phone, name) {
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

async function getOrCreateConversation(api, contactId, phone, inboxId, accountId) {
  const key = `${accountId}:${phone}`
  if (convCache.has(key)) return convCache.get(key)

  const res = await api.get(`/contacts/${contactId}/conversations`)
  const existing = (res.data.payload ?? []).find(
    c => c.inbox_id === parseInt(inboxId) && c.status !== 'resolved'
  )
  if (existing) {
    convCache.set(key, existing.id)
    return existing.id
  }

  const conv = await api.post('/conversations', {
    contact_id: contactId,
    inbox_id: parseInt(inboxId),
  })
  convCache.set(key, conv.data.id)
  return conv.data.id
}
