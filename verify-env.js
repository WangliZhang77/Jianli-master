// 验证 .env 文件
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envPath = path.join(__dirname, '.env')

console.log('='.repeat(50))
console.log('检查 .env 文件配置')
console.log('='.repeat(50))
console.log('')

// 检查文件是否存在
if (!fs.existsSync(envPath)) {
  console.error('❌ .env 文件不存在')
  console.error('文件路径:', envPath)
  console.error('')
  console.error('请创建 .env 文件，内容如下:')
  console.error('OPENAI_API_KEY=your_openai_api_key_here')
  console.error('PORT=3001')
  process.exit(1)
}

console.log('✅ .env 文件存在')
console.log('文件路径:', envPath)
console.log('')

// 读取文件内容
try {
  const content = fs.readFileSync(envPath, 'utf-8')
  console.log('文件内容:')
  console.log('-'.repeat(50))
  // 隐藏 API 密钥的中间部分
  const lines = content.split('\n')
  lines.forEach((line, index) => {
    if (line.includes('OPENAI_API_KEY')) {
      const parts = line.split('=')
      if (parts.length > 1 && parts[1].length > 20) {
        const key = parts[1]
        const masked = key.substring(0, 20) + '...' + key.substring(key.length - 10)
        console.log(`${index + 1}: ${parts[0]}=${masked}`)
      } else {
        console.log(`${index + 1}: ${line}`)
      }
    } else {
      console.log(`${index + 1}: ${line}`)
    }
  })
  console.log('-'.repeat(50))
  console.log('')
} catch (error) {
  console.error('❌ 读取文件失败:', error.message)
  process.exit(1)
}

// 加载环境变量
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ 加载 .env 文件失败:', result.error.message)
  process.exit(1)
}

console.log('✅ .env 文件加载成功')
console.log('')

// 检查必要的环境变量
const apiKey = process.env.OPENAI_API_KEY
const port = process.env.PORT || '3001'

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY 未设置')
  process.exit(1)
}

if (apiKey.trim().length === 0) {
  console.error('❌ OPENAI_API_KEY 为空')
  process.exit(1)
}

console.log('✅ OPENAI_API_KEY 已设置')
console.log('   密钥长度:', apiKey.length, '字符')
console.log('   密钥前缀:', apiKey.substring(0, 20) + '...')
console.log('')

console.log('✅ PORT 已设置:', port)
console.log('')

console.log('='.repeat(50))
console.log('✅ 所有检查通过！环境变量配置正确')
console.log('='.repeat(50))
