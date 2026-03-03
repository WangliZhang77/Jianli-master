import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function AnimatedBackground({ performanceMode = true }) {
  // 性能模式：只保留一层静态渐变背景，完全关闭动画和鼠标跟随
  if (performanceMode) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    )
  }

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* 动态渐变背景 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.35) 0%, transparent 55%)',
            'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.35) 0%, transparent 55%)',
            'radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.35) 0%, transparent 55%)',
            'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.35) 0%, transparent 55%)',
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 流动波纹 */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen blur-3xl opacity-25"
          style={{
            width: `${320 + i * 90}px`,
            height: `${320 + i * 90}px`,
            background: `radial-gradient(circle, ${
              i % 3 === 0
                ? 'rgba(147, 51, 234, 0.5)'
                : i % 3 === 1
                ? 'rgba(59, 130, 246, 0.5)'
                : 'rgba(168, 85, 247, 0.5)'
            } 0%, transparent 70%)`,
          }}
          animate={{
            x: [`${18 + i * 14}%`, `${62 + i * 8}%`, `${18 + i * 14}%`],
            y: [`${32 + i * 8}%`, `${70 - i * 10}%`, `${32 + i * 8}%`],
            scale: [1, 1.18, 1],
          }}
          transition={{
            duration: 18 + i * 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}

      {/* 鼠标跟随光晕 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 197, 253, 0.6) 0%, transparent 70%)',
        }}
        animate={{
          x: mousePosition.x * window.innerWidth - 192,
          y: mousePosition.y * window.innerHeight - 192,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 200,
        }}
      />

      {/* 细网格 */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  )
}

export default AnimatedBackground

