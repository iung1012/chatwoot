import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const FILE = join(process.cwd(), 'data', 'clients.json')

async function read() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'))
  } catch {
    return []
  }
}

async function write(clients) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(FILE, JSON.stringify(clients, null, 2))
}

export async function getClients() {
  return read()
}

export async function getClient(id) {
  const clients = await read()
  return clients.find(c => c.id === id) ?? null
}

export async function addClient(client) {
  const clients = await read()
  clients.push(client)
  await write(clients)
}

export async function removeClient(id) {
  const clients = await read()
  await write(clients.filter(c => c.id !== id))
}
