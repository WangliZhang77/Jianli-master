import { extractAndOptimizeResume } from './resumeService.js'
import { generateCoverLetter } from './coverLetterService.js'

/**
 * 一键流程：一次调用得到职位信息+优化简历，再一次调用生成推荐信（JD 只发 2 次，省 token）。
 */
export async function runFullFlow({
  jobDescription,
  resume,
  resumeInstruction,
  resumeSystemPrompt,
  coverLetterInstruction,
  coverLetterSystemPrompt,
}) {
  const { companyName, position, optimizedResume } = await extractAndOptimizeResume(
    resume,
    jobDescription,
    resumeInstruction,
    resumeSystemPrompt
  )

  const coverLetter = await generateCoverLetter(
    optimizedResume,
    jobDescription,
    coverLetterInstruction,
    coverLetterSystemPrompt
  )

  return {
    companyName: companyName || '',
    position: position || '',
    optimizedResume: optimizedResume || '',
    coverLetter: coverLetter || '',
  }
}
