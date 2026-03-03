import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, date, company_name AS companyName, position, job_description AS jobDescription, resume, cover_letter AS coverLetter, created_at AS createdAt FROM applications WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id)
    res.json(rows)
  } catch (e) {
    console.error('List applications error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { companyName, position, jobDescription, resume, coverLetter } = req.body || {}
    const stmt = db.prepare(
      'INSERT INTO applications (user_id, date, company_name, position, job_description, resume, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const date = new Date().toISOString()
    stmt.run(
      req.user.id,
      date,
      companyName || '',
      position || '',
      jobDescription || '',
      resume || '',
      coverLetter || ''
    )
    const id = db.prepare('SELECT last_insert_rowid() as id').get().id
    const row = db.prepare(
      'SELECT id, date, company_name AS companyName, position, job_description AS jobDescription, resume, cover_letter AS coverLetter, created_at AS createdAt FROM applications WHERE id = ?'
    ).get(id)
    res.status(201).json(row)
  } catch (e) {
    console.error('Create application error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(id, req.user.id)
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('Delete application error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 批量导入本地记录到当前账号
router.post('/import', (req, res) => {
  try {
    const list = req.body?.applications
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({ error: 'applications array required' })
    }
    const stmt = db.prepare(
      'INSERT INTO applications (user_id, date, company_name, position, job_description, resume, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    let imported = 0
    for (const app of list) {
      const date = app.date || new Date().toISOString()
      const companyName = app.companyName ?? app.company_name ?? ''
      const position = app.position ?? ''
      const jobDescription = app.jobDescription ?? app.job_description ?? ''
      const resume = app.resume ?? ''
      const coverLetter = app.coverLetter ?? app.cover_letter ?? ''
      stmt.run(req.user.id, date, companyName, position, jobDescription, resume, coverLetter)
      imported += 1
    }
    res.json({ ok: true, imported })
  } catch (e) {
    console.error('Import applications error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
