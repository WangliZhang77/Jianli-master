import { motion } from 'framer-motion'

function AppleButton({ children, onClick, variant = 'primary', className = '', ...rest }) {
  const baseClasses =
    variant === 'primary'
      ? 'bg-white/90 text-slate-900 hover:bg-white'
      : 'bg-white/10 text-white border border-white/30 hover:bg-white/15'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative inline-flex items-center justify-center
        px-6 py-2.5 rounded-full
        text-sm md:text-base font-medium
        ${baseClasses}
        backdrop-blur-sm
        overflow-hidden
        ${className}
      `}
      {...rest}
    >
      {/* 悬浮光效 */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        initial={{ x: '-120%' }}
        whileHover={{
          x: '120%',
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

export default AppleButton

