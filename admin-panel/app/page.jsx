'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LABEL = {
  connected: { text: 'Conectado', cls: 'bg-green-100 text-green-700' },
  qr_pending: { text: 'Aguardando QR', cls: 'bg-yellow-100 text-yellow-700' },
  connecting: { text: 'Conectando', cls: 'bg-blue-100 text-blue-700' },
  disconnected: { text: 'Desconectado', cls: 'bg-red-100 text-red-700' },
  offline: { text: 'Offline', cls: 'bg-gray-100 text-gray-500' },
}

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchClients()
    const interval = setInterval(fetchClients, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchClients() {
    const res = await fetch('/api/clients')
    if (res.ok) setClients(await res.json())
    setLoading(false)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remover cliente "${name}"?`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    fetchClients()
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clients/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            + Novo Cliente
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg border"
          >
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum cliente ainda.</p>
          <Link href="/clients/new" className="text-indigo-600 mt-2 inline-block hover:underline">
            Criar o primeiro cliente →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map(client => {
            const status = STATUS_LABEL[client.whatsapp_status] ?? STATUS_LABEL.offline
            return (
              <div key={client.id} className="bg-white rounded-2xl shadow-sm border p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{client.name}</p>
                  <p className="text-gray-500 text-sm">{client.email}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Conta #{client.chatwoot_account_id} · Inbox #{client.chatwoot_inbox_id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.cls}`}>
                    {status.text}
                  </span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    Gerenciar
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
