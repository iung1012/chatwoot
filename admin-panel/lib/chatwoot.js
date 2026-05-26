import axios from 'axios'

const BASE = process.env.CHATWOOT_URL

export async function signUp({ accountName, email, password }) {
  const res = await axios.post(`${BASE}/auth/sign_up`, {
    account_name: accountName,
    email,
    password,
    password_confirmation: password,
  })
  const { access_token, account_id } = res.data.data
  return { token: access_token, accountId: account_id }
}

export async function createInbox({ accountId, token, webhookUrl }) {
  const res = await axios.post(
    `${BASE}/api/v1/accounts/${accountId}/inboxes`,
    { name: 'WhatsApp', channel: { type: 'api', webhook_url: webhookUrl } },
    { headers: { api_access_token: token } }
  )
  return res.data
}

export async function createWebhook({ accountId, token, webhookUrl }) {
  await axios.post(
    `${BASE}/api/v1/accounts/${accountId}/integrations/webhooks`,
    { url: webhookUrl, subscriptions: ['message_created'] },
    { headers: { api_access_token: token } }
  )
}
