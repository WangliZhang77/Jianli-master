// 首先加载环境变量
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载 .env 文件（从项目根目录）
const envPath = join(__dirname, '..', '.env')
console.log('正在加载环境变量文件:', envPath)

const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  警告: 无法加载 .env 文件:', result.error.message)
  console.warn('将使用系统环境变量')
} else {
  console.log('✅ 环境变量文件加载成功')
}

// API Key 可从环境变量或前端请求中提供，启动时不强制
if (!process.env.OPENAI_API_KEY) {
  console.log('💡 未配置 OPENAI_API_KEY：可在前端「设置 API Key」中输入，或配置 .env / 云端环境变量')
} else {
  console.log('✅ 服务端已配置 OpenAI API 密钥（也可在前端覆盖）')
}

/** 从请求中获取 API Key：body.apiKey > header X-OpenAI-API-Key > 环境变量 */
function getApiKeyFromRequest(req) {
  return (req.body && req.body.apiKey) || req.get('X-OpenAI-API-Key') || process.env.OPENAI_API_KEY
}

// 确保环境变量已加载后再导入其他模块
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { optimizeResume } from './services/resumeService.js'
import { generateCoverLetter } from './services/coverLetterService.js'
import { parseResumeFile } from './utils/fileParser.js'
import { extractJobInfo } from './services/jobInfoExtractor.js'
import { runFullFlow } from './services/fullFlowService.js'
import db from './db.js'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import applicationsRoutes from './routes/applications.js'
import promptsRoutes from './routes/prompts.js'

const app = express()
const PORT = process.env.PORT || 3001

// 确保 uploads 目录存在
const uploadsDir = 'uploads'
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(cors())
// 提高 JSON 请求体大小限制，避免导入大量投递记录时报 request entity too large
app.use(express.json({ limit: '10mb' }))

// Configure multer for file uploads
const upload = multer({ 
  dest: uploadsDir + '/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 限制
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter 检查文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    })
    
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream' // 某些浏览器可能发送这个类型
    ]
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const fileExtension = path.extname(file.originalname).toLowerCase()
    
    // 如果 MIME 类型是 application/octet-stream，检查文件扩展名
    if (file.mimetype === 'application/octet-stream') {
      if (allowedExtensions.includes(fileExtension)) {
        console.log('通过文件扩展名验证:', fileExtension)
        cb(null, true)
        return
      }
    }
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('文件类型验证通过')
      cb(null, true)
    } else {
      console.error('文件类型验证失败:', { mimetype: file.mimetype, extension: fileExtension })
      cb(new Error(`不支持的文件格式: ${file.mimetype || fileExtension}，请上传 PDF 或 Word 文档`), false)
    }
  }
})

// Health check (optional DB ping)
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get()
    res.json({ status: 'ok', message: '服务器运行正常', db: 'ok' })
  } catch (e) {
    res.status(503).json({ status: 'error', message: 'DB check failed', db: 'error' })
  }
})

// Rate limit for auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts, please try again later' },
})
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/prompts', promptsRoutes)

// Routes
app.post('/api/upload-resume', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      console.error('Multer 错误:', err)
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: '文件大小超过限制（最大 10MB）' })
        }
        return res.status(400).json({ error: '文件上传错误: ' + err.message })
      }
      return res.status(400).json({ error: err.message || '文件上传失败' })
    }
    next()
  })
}, async (req, res) => {
  try {
    console.log('收到上传请求，文件信息:', {
      hasFile: !!req.file,
      body: req.body,
      files: req.files
    })

    if (!req.file) {
      console.error('没有收到文件')
      return res.status(400).json({ error: '请上传文件' })
    }

    console.log('收到文件上传:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    })

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const fileExtension = path.extname(req.file.originalname).toLowerCase()
    
    if (!allowedTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      console.error('不支持的文件类型:', req.file.mimetype, fileExtension)
      // 删除上传的文件
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(400).json({ 
        error: `不支持的文件格式: ${req.file.mimetype || fileExtension}，请上传 PDF 或 Word 文档` 
      })
    }

    console.log('开始解析文件...')
    const text = await parseResumeFile(req.file.path, req.file.mimetype)
    
    if (!text || text.trim().length === 0) {
      console.error('文件解析后内容为空')
      return res.status(400).json({ error: '文件解析后内容为空，请检查文件格式' })
    }

    console.log('文件解析成功，文本长度:', text.length)
    res.json({ text })
  } catch (error) {
    console.error('Upload error 详细信息:')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)
    
    // 清理上传的文件（如果存在）
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path)
        console.log('已清理临时文件:', req.file.path)
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError)
      }
    }
    
    // 确保总是返回有效的 JSON
    const errorMessage = error.message || '文件上传或解析失败'
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

app.post('/api/optimize-resume', async (req, res) => {
  try {
    const apiKey = getApiKeyFromRequest(req)
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端「设置 API Key」中输入 OpenAI API 密钥' })
    }
    const { resume, jobDescription, prompt, systemPrompt } = req.body

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: '请提供简历和岗位描述' })
    }

    const optimizedResume = await optimizeResume(resume, jobDescription, prompt, systemPrompt, apiKey)
    res.json({ optimizedResume })
  } catch (error) {
    console.error('Optimize error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/generate-cover-letter', async (req, res) => {
  try {
    const apiKey = getApiKeyFromRequest(req)
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端「设置 API Key」中输入 OpenAI API 密钥' })
    }
    const { resume, jobDescription, prompt, systemPrompt, companyInfo } = req.body

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: '请提供简历和岗位描述' })
    }

    const coverLetter = await generateCoverLetter(resume, jobDescription, prompt, systemPrompt, apiKey, companyInfo)
    res.json({ coverLetter })
  } catch (error) {
    console.error('Cover letter error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/extract-job-info', async (req, res) => {
  try {
    const apiKey = getApiKeyFromRequest(req)
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端「设置 API Key」中输入 OpenAI API 密钥' })
    }
    const { jobDescription } = req.body

    if (!jobDescription) {
      return res.status(400).json({ error: '请提供岗位描述' })
    }

    const jobInfo = await extractJobInfo(jobDescription, apiKey)
    res.json(jobInfo)
  } catch (error) {
    console.error('Extract job info error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 一键流程：岗位描述和简历只发一次，返回 职位信息 + 优化简历 + 推荐信
app.post('/api/full-flow', async (req, res) => {
  try {
    const apiKey = getApiKeyFromRequest(req)
    if (!apiKey) {
      return res.status(400).json({ error: '请在前端「设置 API Key」中输入 OpenAI API 密钥' })
    }
    const {
      resume,
      jobDescription,
      resumeInstruction,
      resumeSystemPrompt,
      coverLetterInstruction,
      coverLetterSystemPrompt,
    } = req.body

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: '请提供简历和岗位描述' })
    }

    const result = await runFullFlow({
      jobDescription,
      resume,
      resumeInstruction: resumeInstruction || undefined,
      resumeSystemPrompt: resumeSystemPrompt || undefined,
      coverLetterInstruction: coverLetterInstruction || undefined,
      coverLetterSystemPrompt: coverLetterSystemPrompt || undefined,
      apiKey,
    })
    res.json(result)
  } catch (error) {
    console.error('Full flow error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 生产环境：托管前端静态文件（npm run build 生成的 dist）
const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    // SPA 前端路由：非 /api 的 GET 请求返回 index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(join(distPath, 'index.html'), (err) => { if (err) next(err) })
    })
  }
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('未处理的错误:', err)
  res.status(500).json({ 
    error: err.message || '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log('='.repeat(50))
  console.log(`✅ 服务器启动成功！`)
  console.log(`📡 服务器运行在 http://localhost:${PORT}`)
  console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`🔑 OpenAI API 密钥: ${process.env.OPENAI_API_KEY ? '服务端已配置' : '由前端提供'}`)
  console.log('='.repeat(50))
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 错误: 端口 ${PORT} 已被占用`)
    console.error(`请关闭占用该端口的程序，或修改 .env 文件中的 PORT 值`)
  } else {
    console.error('❌ 服务器启动失败:', err.message)
    console.error('错误详情:', err)
  }
  process.exit(1)
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err)
  console.error('错误堆栈:', err.stack)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason)
  console.error('Promise:', promise)
})
