import axios from 'axios'

const api = axios.create({
  baseURL: `${process.env.BAILEYS_SERVICE_URL}/api`,
  headers: { 'x-api-token': process.env.BAILEYS_ADMIN_TOKEN },
})

export async function createInstance({ name, inboxId, accountId, token }) {
  const res = await api.post('/instances', {
    name,
    inbox_id: inboxId,
    account_id: accountId,
    token,
  })
  return res.data
}

export async function removeInstance(name) {
  await api.delete(`/instances/${name}`)
}

export async function getQRCode(name) {
  const res = await api.get(`/instances/${name}/qrcode`)
  return res.data
}

export async function listInstances() {
  const res = await api.get('/instances')
  return res.data
}
