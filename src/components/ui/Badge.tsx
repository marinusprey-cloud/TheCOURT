import clsx from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'clay' | 'court' | 'neutral' | 'loss'

const tones: Record<Tone, string> = {
  clay: 'bg-clay/15 text-clay border-clay/30',
  court: 'bg-court/15 text-court border-court/30',
  neutral: 'bg-paper/8 text-paper-dim border-hairline-strong',
  loss: 'bg-loss/15 text-loss border-loss/30',
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
