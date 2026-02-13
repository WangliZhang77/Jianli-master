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

// 验证必要的环境变量
if (!process.env.OPENAI_API_KEY) {
  console.error('='.repeat(50))
  console.error('❌ 错误: OPENAI_API_KEY 环境变量未设置')
  console.error('='.repeat(50))
  console.error('请在项目根目录创建 .env 文件，并添加以下内容:')
  console.error('')
  console.error('OPENAI_API_KEY=your_openai_api_key_here')
  console.error('PORT=3001')
  console.error('')
  console.error('当前环境变量值:')
  console.error('OPENAI_API_KEY:', process.env.OPENAI_API_KEY || '(未设置)')
  console.error('='.repeat(50))
  process.exit(1)
}

console.log('✅ OpenAI API 密钥已配置')

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

const app = express()
const PORT = process.env.PORT || 3001

// 确保 uploads 目录存在
const uploadsDir = 'uploads'
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(cors())
app.use(express.json())

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

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' })
})

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
    const { resume, jobDescription, prompt, systemPrompt } = req.body

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: '请提供简历和岗位描述' })
    }

    const optimizedResume = await optimizeResume(resume, jobDescription, prompt, systemPrompt)
    res.json({ optimizedResume })
  } catch (error) {
    console.error('Optimize error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/generate-cover-letter', async (req, res) => {
  try {
    const { resume, jobDescription, prompt, systemPrompt } = req.body

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: '请提供简历和岗位描述' })
    }

    const coverLetter = await generateCoverLetter(resume, jobDescription, prompt, systemPrompt)
    res.json({ coverLetter })
  } catch (error) {
    console.error('Cover letter error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/extract-job-info', async (req, res) => {
  try {
    const { jobDescription } = req.body

    if (!jobDescription) {
      return res.status(400).json({ error: '请提供岗位描述' })
    }

    const jobInfo = await extractJobInfo(jobDescription)
    res.json(jobInfo)
  } catch (error) {
    console.error('Extract job info error:', error)
    res.status(500).json({ error: error.message })
  }
})

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
  console.log(`🔑 OpenAI API 密钥: ${process.env.OPENAI_API_KEY ? '已配置' : '未配置'}`)
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
