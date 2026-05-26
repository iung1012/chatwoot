import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getClients, addClient } from '@/lib/data'
import { signUp, createInbox, createWebhook } from '@/lib/chatwoot'
import { createInstance, listInstances } from '@/lib/baileys'

export async function GET() {
  try {
    const [clients, instances] = await Promise.all([getClients(), listInstances()])
    const statusMap = Object.fromEntries(instances.map(i => [i.name, i.status]))
    const result = clients.map(c => ({
      ...c,
      whatsapp_status: statusMap[c.baileys_instance] ?? 'offline',
    }))
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email e password são obrigatórios' }, { status: 400 })
  }

  const id = randomUUID()
  const webhookUrl = `${process.env.BAILEYS_SERVICE_URL}/webhook`

  try {
    // 1. Cria conta no Chatwoot
    const { token, accountId } = await signUp({ accountName: name, email, password })

    // 2. Cria inbox do tipo API
    const inbox = await createInbox({ accountId, token, webhookUrl })

    // 3. Cria webhook para receber respostas dos agentes
    await createWebhook({ accountId, token, webhookUrl })

    // 4. Inicia instância Baileys
    await createInstance({ name: id, inboxId: inbox.id, accountId, token })

    // 5. Persiste no arquivo local
    await addClient({
      id,
      name,
      email,
      chatwoot_account_id: accountId,
      chatwoot_token: token,
      chatwoot_inbox_id: inbox.id,
      baileys_instance: id,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.response?.data?.message ?? err.message }, { status: 500 })
  }
}
