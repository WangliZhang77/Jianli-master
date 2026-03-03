import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { signToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const emailTrim = String(email).trim().toLowerCase()
    if (emailTrim.length < 3) {
      return res.status(400).json({ error: 'Email too short' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const passwordHash = bcrypt.hashSync(password, 10)
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    stmt.run(emailTrim, passwordHash)
    const row = db.prepare('SELECT id, email, created_at FROM users WHERE email = ?').get(emailTrim)
    const token = signToken({ userId: row.id, email: row.email })
    res.status(201).json({ token, user: { id: row.id, email: row.email } })
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    console.error('Register error:', e)
    res.status(500).json({ error: e.message || 'Registration failed' })
  }
})

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const emailTrim = String(email).trim().toLowerCase()
    const row = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(emailTrim)
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    if (!bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = signToken({ userId: row.id, email: row.email })
    res.json({ token, user: { id: row.id, email: row.email } })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: e.message || 'Login failed' })
  }
})

export default router
