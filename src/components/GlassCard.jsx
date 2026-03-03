import { motion } from 'framer-motion'

function GlassCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/8 backdrop-blur-2xl
        border border-white/15
        shadow-[0_18px_70px_rgba(15,23,42,0.75)]
        ${className}
      `}
    >
      {/* 顶部高光 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

      <div className="relative z-10">{children}</div>

      {/* 底部光晕线 */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </motion.div>
  )
}

export default GlassCard

