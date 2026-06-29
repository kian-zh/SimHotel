import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  className?: string
}

export function AnimatedNumber({ value, format = (n) => n.toLocaleString(), className = '' }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => format(Math.round(v)))

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span className={`font-mono ${className}`}>{display}</motion.span>
}
