import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-card-dark text-slate-800 hover:bg-border',
  ghost: 'bg-transparent text-slate-700 hover:bg-card-dark',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  ),
)
Button.displayName = 'Button'
