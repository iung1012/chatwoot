import { NextResponse } from 'next/server'
import { getClient } from '@/lib/data'
import { getQRCode } from '@/lib/baileys'

export async function GET(_, { params }) {
  const client = await getClient(params.id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const data = await getQRCode(client.baileys_instance)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
