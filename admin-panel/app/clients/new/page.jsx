'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar cliente')
      setLoading(false)
      return
    }

    router.push(`/clients/${data.id}`)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="text-indigo-600 hover:underline text-sm">← Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Novo Cliente</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cria uma conta no Chatwoot e conecta o WhatsApp automaticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Ex: Loja do João"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do cliente</label>
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="cliente@empresa.com"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha de acesso</label>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Mínimo 6 caracteres"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            minLength={6}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            O cliente usará esses dados para acessar o Chatwoot.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Criando conta e iniciando WhatsApp...' : 'Criar Cliente'}
        </button>
      </form>
    </div>
  )
}
