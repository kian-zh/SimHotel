import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-card p-4 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </motion.div>
  )
}
