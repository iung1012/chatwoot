'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ClientPage() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [qr, setQr] = useState({ status: 'connecting', qrCode: null })

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(setClient)
  }, [id])

  useEffect(() => {
    if (!client) return
    const poll = setInterval(async () => {
      const res = await fetch(`/api/clients/${id}/qrcode`)
      if (res.ok) {
        const data = await res.json()
        setQr(data)
        if (data.status === 'connected') clearInterval(poll)
      }
    }, 2500)
    return () => clearInterval(poll)
  }, [client, id])

  if (!client) return <div className="p-6 text-gray-400">Carregando...</div>

  const chatwootUrl = `${process.env.NEXT_PUBLIC_CHATWOOT_URL ?? ''}`

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/" className="text-indigo-600 hover:underline text-sm">← Voltar</Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-3">{client.name}</h1>
      <p className="text-gray-500 text-sm">{client.email}</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <InfoCard label="Conta Chatwoot" value={`#${client.chatwoot_account_id}`} />
        <InfoCard label="Inbox ID" value={`#${client.chatwoot_inbox_id}`} />
        <InfoCard label="Criado em" value={new Date(client.created_at).toLocaleDateString('pt-BR')} />
        <InfoCard label="Instância" value={client.baileys_instance.slice(0, 8) + '...'} />
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Status do WhatsApp</h2>

        {qr.status === 'connected' && (
          <div className="flex items-center gap-3 text-green-700">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-semibold">Conectado!</p>
              <p className="text-sm text-gray-500">WhatsApp ativo e recebendo mensagens.</p>
            </div>
          </div>
        )}

        {qr.status === 'qr_pending' && qr.qrCode && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Abra o WhatsApp no celular do cliente → <strong>Dispositivos conectados → Conectar dispositivo</strong> → escaneie:
            </p>
            <img src={qr.qrCode} alt="QR Code" className="mx-auto w-56 h-56 rounded-lg border" />
            <p className="text-xs text-gray-400 mt-3">Atualizando automaticamente...</p>
          </div>
        )}

        {(qr.status === 'connecting' || qr.status === 'disconnected') && (
          <div className="flex items-center gap-3 text-gray-500">
            <span className="animate-spin text-xl">⏳</span>
            <p className="text-sm">
              {qr.status === 'connecting' ? 'Iniciando conexão...' : 'Reconectando...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  )
}
