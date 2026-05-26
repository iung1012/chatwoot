import { NextResponse } from 'next/server'
import { getClient, removeClient } from '@/lib/data'
import { removeInstance } from '@/lib/baileys'

export async function GET(_, { params }) {
  const client = await getClient(params.id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function DELETE(_, { params }) {
  const client = await getClient(params.id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await removeInstance(client.baileys_instance)
  } catch {}

  await removeClient(params.id)
  return NextResponse.json({ ok: true })
}
