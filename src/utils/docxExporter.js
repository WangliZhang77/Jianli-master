import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

/**
 * 导出推荐信为 DOCX 文件
 * @param {string} coverLetter - 推荐信内容
 * @param {string} fileName - 文件名（可选）
 */
export async function exportCoverLetterToDocx(coverLetter, fileName = 'Cover_Letter.docx') {
  try {
    // 将文本按段落分割（按换行符）
    const paragraphs = coverLetter.split('\n').filter(line => line.trim().length > 0)
    
    // 创建文档段落
    const docParagraphs = paragraphs.map(text => {
      return new Paragraph({
        children: [
          new TextRun({
            text: text.trim(),
            font: 'Times New Roman',
            size: 22, // 11pt
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: {
          after: 200, // 段落后间距
        },
      })
    })

    // 如果段落为空，至少添加一个段落
    if (docParagraphs.length === 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: coverLetter || 'Cover Letter',
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        })
      )
    }

    // 创建文档
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docParagraphs,
        },
      ],
    })

    // 生成并下载文件
    const blob = await Packer.toBlob(doc)
    saveAs(blob, fileName)
    
    return true
  } catch (error) {
    console.error('导出 DOCX 失败:', error)
    throw new Error('导出 DOCX 文件失败: ' + error.message)
  }
}

/**
 * 导出推荐信为 DOCX 文件（带格式优化）
 * @param {string} coverLetter - 推荐信内容
 * @param {string} companyName - 公司名称（用于文件名）
 * @param {string} position - 职位（用于文件名）
 */
export async function exportCoverLetterToDocxFormatted(
  coverLetter, 
  companyName = '', 
  position = ''
) {
  try {
    // 生成文件名
    let fileName = 'Cover_Letter'
    if (companyName) {
      fileName += `_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}`
    }
    if (position) {
      fileName += `_${position.replace(/[^a-zA-Z0-9]/g, '_')}`
    }
    fileName += '.docx'

    // 将文本按段落分割
    const lines = coverLetter.split('\n')
    const docParagraphs = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.length === 0) {
        // 空行，添加空段落
        docParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '', break: 1 })],
            spacing: { after: 100 },
          })
        )
        continue
      }

      // 判断是否是标题或特殊格式
      const isGreeting = line.match(/^(Dear|To|尊敬的)/i)
      const isClosing = line.match(/^(Sincerely|Best regards|Yours sincerely|此致|敬礼)/i)
      
      let alignment = AlignmentType.LEFT
      let size = 22 // 11pt
      
      if (isGreeting) {
        alignment = AlignmentType.LEFT
      } else if (isClosing) {
        alignment = AlignmentType.LEFT
        // 在签名前添加一些空行
        if (i < lines.length - 3) {
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '', break: 1 })],
              spacing: { after: 200 },
            })
          )
        }
      }

      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Times New Roman',
              size: size,
            }),
          ],
          alignment: alignment,
          spacing: {
            after: isClosing ? 400 : 200,
          },
        })
      )
    }

    // 如果段落为空，至少添加一个段落
    if (docParagraphs.length === 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: coverLetter || 'Cover Letter',
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        })
      )
    }

    // 创建文档
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docParagraphs,
        },
      ],
    })

    // 生成并下载文件
    const blob = await Packer.toBlob(doc)
    saveAs(blob, fileName)
    
    return true
  } catch (error) {
    console.error('导出 DOCX 失败:', error)
    throw new Error('导出 DOCX 文件失败: ' + error.message)
  }
}
