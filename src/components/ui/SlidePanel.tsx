import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface PanelProps {
  open: boolean
  children: ReactNode
  side?: 'left' | 'right' | 'bottom'
  className?: string
}

export function SlidePanel({ open, children, side = 'right', className = '' }: PanelProps) {
  const variants = {
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  }[side]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className={`absolute z-20 ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
