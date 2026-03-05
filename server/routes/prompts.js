import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(requireAuth)

/** GET /api/prompts -> { resume: [], coverLetter: [] } */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT kind, data FROM user_prompts WHERE user_id = ?'
    ).all(req.user.id)
    let resume = []
    let coverLetter = []
    for (const row of rows) {
      try {
        const arr = JSON.parse(row.data)
        if (!Array.isArray(arr)) continue
        if (row.kind === 'resume') resume = arr
        else if (row.kind === 'coverLetter') coverLetter = arr
      } catch (_) {}
    }
    res.json({ resume, coverLetter })
  } catch (e) {
    console.error('GET /api/prompts error:', e)
    res.status(500).json({ error: e.message })
  }
})

/** POST /api/prompts body: { kind: 'resume'|'coverLetter', data: [] } */
router.post('/', (req, res) => {
  try {
    const { kind, data } = req.body || {}
    if (!kind || !Array.isArray(data)) {
      return res.status(400).json({ error: 'kind and data (array) required' })
    }
    if (kind !== 'resume' && kind !== 'coverLetter') {
      return res.status(400).json({ error: 'kind must be resume or coverLetter' })
    }
    const dataStr = JSON.stringify(data)
    db.prepare(
      `INSERT INTO user_prompts (user_id, kind, data, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, kind) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
    ).run(req.user.id, kind, dataStr)
    res.json({ ok: true })
  } catch (e) {
    console.error('POST /api/prompts error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
