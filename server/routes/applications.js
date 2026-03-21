import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { classifyApplicationsBatch } from '../services/applicationClassificationService.js'
import {
  buildInsightStatsFromRows,
  fingerprintForInsight,
  generateDeliveryPersonaInsight,
} from '../services/applicationInsightService.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, date, company_name AS companyName, position, job_description AS jobDescription,
       resume, cover_letter AS coverLetter, created_at AS createdAt,
       job_category_ai AS jobCategoryAi, job_seniority_ai AS jobSeniorityAi, classification_at AS classificationAt
       FROM applications WHERE user_id = ? ORDER BY created_at DESC`
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
      `SELECT id, date, company_name AS companyName, position, job_description AS jobDescription,
       resume, cover_letter AS coverLetter, created_at AS createdAt,
       job_category_ai AS jobCategoryAi, job_seniority_ai AS jobSeniorityAi, classification_at AS classificationAt
       FROM applications WHERE id = ?`
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

/**
 * POST /api/applications/classify
 * body: { apiKey?: string, force?: boolean }
 * 使用 AI 为每条投递标注岗位类别 + 职级；未登录不可用（本路由已 requireAuth）
 * 自动策略：未分类的立即分类；已全部分类且 24h 内未跑过则跳过；超过 24h 则全量重算一次
 * force=true：手动刷新，全量重算
 */
router.post('/classify', async (req, res) => {
  try {
    const apiKey = req.body?.apiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端设置 OpenAI API Key 或在服务端配置 OPENAI_API_KEY' })
    }
    const force = req.body?.force === true

    const rows = db.prepare(
      `SELECT id, position, job_description AS jobDescription, job_category_ai, classification_at
       FROM applications WHERE user_id = ? ORDER BY created_at DESC`
    ).all(req.user.id)

    if (rows.length === 0) {
      return res.json({ ok: true, skipped: true, reason: 'no_records', updated: 0 })
    }

    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const now = Date.now()
    const lastRunTs = rows.reduce((max, r) => {
      if (!r.classification_at) return max
      const t = new Date(r.classification_at).getTime()
      return Number.isNaN(t) ? max : Math.max(max, t)
    }, 0)

    const olderThan24h = !lastRunTs || now - lastRunTs > ONE_DAY_MS
    const missingCategory = rows.filter((r) => !r.job_category_ai)

    let toClassify = []
    if (force) {
      toClassify = rows.map((r) => ({ id: r.id, position: r.position, jobDescription: r.jobDescription }))
    } else if (missingCategory.length > 0) {
      toClassify = missingCategory.map((r) => ({ id: r.id, position: r.position, jobDescription: r.jobDescription }))
    } else if (olderThan24h) {
      toClassify = rows.map((r) => ({ id: r.id, position: r.position, jobDescription: r.jobDescription }))
    } else {
      return res.json({ ok: true, skipped: true, reason: 'fresh_within_24h', updated: 0 })
    }

    const CHUNK = 10
    let updated = 0
    const isoNow = new Date().toISOString()
    const updateStmt = db.prepare(
      'UPDATE applications SET job_category_ai = ?, job_seniority_ai = ?, classification_at = ? WHERE id = ? AND user_id = ?'
    )

    for (let i = 0; i < toClassify.length; i += CHUNK) {
      const chunk = toClassify.slice(i, i + CHUNK)
      const batchResults = await classifyApplicationsBatch(chunk, apiKey)
      const tx = db.transaction((results) => {
        for (const r of results) {
          updateStmt.run(r.category, r.seniority, isoNow, r.id, req.user.id)
          updated += 1
        }
      })
      tx(batchResults)
    }

    res.json({ ok: true, skipped: false, updated })
  } catch (e) {
    console.error('Classify applications error:', e)
    res.status(500).json({ error: e.message })
  }
})

const INSIGHT_KIND = 'application_insight'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * POST /api/applications/insights
 * body: { apiKey?: string, force?: boolean, locale?: 'zh'|'en' }
 * 基于全部投递记录 + AI 分类字段，生成日均投递、取向与「投递画像」；结果缓存 24h（或记录变更后失效）
 */
router.post('/insights', async (req, res) => {
  try {
    const apiKey = req.body?.apiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端设置 OpenAI API Key 或在服务端配置 OPENAI_API_KEY' })
    }
    const force = req.body?.force === true
    const locale = req.body?.locale === 'en' ? 'en' : 'zh'

    const rows = db
      .prepare(
        `SELECT id, date, job_category_ai, job_seniority_ai, created_at AS createdAt, classification_at AS classificationAt
         FROM applications WHERE user_id = ? ORDER BY created_at DESC`
      )
      .all(req.user.id)

    const stats = buildInsightStatsFromRows(rows)
    if (stats.total === 0) {
      return res.json({
        ok: true,
        stats,
        insight: '',
        cached: false,
        generatedAt: null,
      })
    }

    const fp = fingerprintForInsight(rows)
    if (!force) {
      const cachedRow = db
        .prepare('SELECT data FROM user_prompts WHERE user_id = ? AND kind = ?')
        .get(req.user.id, INSIGHT_KIND)
      if (cachedRow?.data) {
        try {
          const cached = JSON.parse(cachedRow.data)
          const genTs = cached.generatedAt ? new Date(cached.generatedAt).getTime() : 0
          const fresh = genTs && Date.now() - genTs < ONE_DAY_MS
          const localeOk = cached.locale === locale || (!cached.locale && locale === 'zh')
          if (
            cached.fingerprint === fp &&
            fresh &&
            typeof cached.text === 'string' &&
            cached.text.length > 0 &&
            localeOk
          ) {
            return res.json({
              ok: true,
              stats,
              insight: cached.text,
              cached: true,
              generatedAt: cached.generatedAt,
            })
          }
        } catch (_) {
          /* 重新生成 */
        }
      }
    }

    const text = await generateDeliveryPersonaInsight(stats, apiKey, locale)
    const generatedAt = new Date().toISOString()
    const payload = JSON.stringify({
      text,
      generatedAt,
      fingerprint: fp,
      locale,
    })
    db.prepare(
      `INSERT INTO user_prompts (user_id, kind, data, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, kind) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
    ).run(req.user.id, INSIGHT_KIND, payload)

    res.json({
      ok: true,
      stats,
      insight: text,
      cached: false,
      generatedAt,
    })
  } catch (e) {
    console.error('Application insights error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
