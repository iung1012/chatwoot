import { Router } from 'express'
import instanceManager from './instance-manager.js'

const router = Router()

router.use((req, res, next) => {
  if (req.headers['x-api-token'] !== process.env.BAILEYS_ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

router.get('/instances', (req, res) => {
  res.json(instanceManager.list())
})

router.post('/instances', async (req, res) => {
  const { name, inbox_id, account_id, token } = req.body
  if (!name || !inbox_id || !account_id || !token) {
    return res.status(400).json({ error: 'name, inbox_id, account_id, token são obrigatórios' })
  }
  try {
    await instanceManager.create({ name, inboxId: inbox_id, accountId: account_id, token })
    res.status(201).json({ name, status: 'connecting' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/instances/:name', (req, res) => {
  const inst = instanceManager.get(req.params.name)
  if (!inst) return res.status(404).json({ error: 'Not found' })
  const { sock, qrCode, ...safe } = inst
  res.json(safe)
})

router.get('/instances/:name/qrcode', (req, res) => {
  const inst = instanceManager.get(req.params.name)
  if (!inst) return res.status(404).json({ error: 'Not found' })
  res.json({ status: inst.status, qrCode: inst.qrCode })
})

router.delete('/instances/:name', async (req, res) => {
  try {
    await instanceManager.remove(req.params.name)
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

export default router
