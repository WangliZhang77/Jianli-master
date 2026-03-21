/**
 * 轻量展示 AI 返回的 Markdown（##、列表、**加粗**）
 */
function parseInline(s) {
  const parts = String(s).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    if (m) {
      return (
        <strong key={i} className="text-white font-semibold">
          {m[1]}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function InsightMarkdownLight({ text }) {
  if (!text?.trim()) return null
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-3 text-sm text-slate-200">
      {blocks.map((block, i) => {
        const b = block.trim()
        if (b.startsWith('## ')) {
          return (
            <h4 key={i} className="text-base font-semibold text-white mt-4 first:mt-0 border-b border-white/10 pb-1">
              {parseInline(b.slice(3))}
            </h4>
          )
        }
        if (b.startsWith('- ') || b.includes('\n- ')) {
          const items = b.split('\n').filter((l) => l.trim().startsWith('- '))
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 text-slate-300">
              {items.map((li, j) => (
                <li key={j}>{parseInline(li.replace(/^\s*-\s+/, ''))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="leading-relaxed whitespace-pre-wrap">
            {parseInline(b)}
          </p>
        )
      })}
    </div>
  )
}
