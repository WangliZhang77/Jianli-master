import fs from 'fs'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function parseResumeFile(filePath, mimeType) {
  let fileBuffer = null
  
  try {
    console.log('parseResumeFile 被调用，参数:', { filePath, mimeType })
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath)
      throw new Error('上传的文件不存在')
    }

    console.log('读取文件:', filePath)
    fileBuffer = fs.readFileSync(filePath)
    
    if (!fileBuffer || fileBuffer.length === 0) {
      console.error('文件为空')
      throw new Error('文件为空')
    }

    console.log('开始解析文件，类型:', mimeType, '大小:', fileBuffer.length)

    // 根据文件类型解析
    if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      console.log('解析 PDF 文件...')
      const data = await pdfParse(fileBuffer)
      const text = data.text || ''
      if (!text.trim()) {
        throw new Error('PDF 文件解析后内容为空，可能是图片型 PDF 或加密文件')
      }
      return text
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.toLowerCase().endsWith('.doc') ||
      filePath.toLowerCase().endsWith('.docx')
    ) {
      console.log('解析 Word 文件...', { mimeType, filePath })
      
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        console.log('Mammoth 解析结果:', {
          hasValue: !!result.value,
          valueLength: result.value?.length || 0,
          messages: result.messages || []
        })
        
        const text = result.value || ''
        
        // 检查是否有警告信息
        if (result.messages && result.messages.length > 0) {
          console.warn('Mammoth 警告:', result.messages)
        }
        
        if (!text.trim()) {
          throw new Error('Word 文件解析后内容为空，可能是文件格式有问题')
        }
        
        return text
      } catch (mammothError) {
        console.error('Mammoth 解析错误:', mammothError)
        // 提供更详细的错误信息
        if (mammothError.message) {
          throw new Error('Word 文档解析失败: ' + mammothError.message)
        }
        throw new Error('Word 文档解析失败，请确保文件是有效的 .docx 格式')
      }
    } else {
      throw new Error(`不支持的文件格式: ${mimeType || '未知'}，请上传 PDF 或 Word 文档`)
    }
  } catch (error) {
    console.error('文件解析错误:', error)
    // 提供更详细的错误信息
    if (error.message.includes('PDF')) {
      throw new Error('PDF 解析失败: ' + error.message)
    } else if (error.message.includes('Word') || error.message.includes('mammoth')) {
      throw new Error('Word 文档解析失败: ' + error.message)
    } else {
      throw new Error('文件解析失败: ' + error.message)
    }
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
        console.log('临时文件已删除:', filePath)
      } catch (cleanupError) {
        console.error('删除临时文件失败:', cleanupError)
      }
    }
  }
}
