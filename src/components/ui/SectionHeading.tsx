import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SectionHeadingProps {
  kicker: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
}

export function SectionHeading({ kicker, title, lede, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-clay"
      >
        {kicker}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="font-display text-4xl font-light leading-[1.05] tracking-tight text-paper sm:text-5xl md:text-6xl"
      >
        {title}
      </motion.h2>
      {lede && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          className="mt-5 max-w-xl font-sans text-base leading-relaxed text-paper-dim"
        >
          {lede}
        </motion.p>
      )}
    </div>
  )
}
