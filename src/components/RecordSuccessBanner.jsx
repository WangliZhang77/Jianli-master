import { useEffect, useRef } from 'react'

const AUTO_CLOSE_MS = 5000

function RecordSuccessBanner({ message, onClose }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose?.()
    }, AUTO_CLOSE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onClose])

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onClose?.()
  }

  if (!message) return null

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-3 rounded-xl shadow-lg border border-white/20 bg-slate-800/95 backdrop-blur-sm text-white min-w-[280px] max-w-[90vw]"
      role="alert"
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}

export default RecordSuccessBanner
