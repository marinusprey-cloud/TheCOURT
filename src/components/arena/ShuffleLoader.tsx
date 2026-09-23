import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface ShuffleLoaderProps {
  names: string[]
}

/** Brief choreographed shuffle: avatars scatter and reconverge before the reveal. */
export function ShuffleLoader({ names }: ShuffleLoaderProps) {
  const jitter = useMemo(
    () => names.map(() => ({ x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 60, r: (Math.random() - 0.5) * 40 })),
    [names],
  )

  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-8">
      <div className="relative flex h-24 w-full max-w-md items-center justify-center">
        {names.map((name, i) => (
          <motion.span
            key={name}
            className="font-display absolute flex h-14 w-14 items-center justify-center rounded-full border border-clay/40 bg-surface-3 text-sm text-paper shadow-lg"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
            animate={{
              x: [0, jitter[i].x, jitter[i].x * -0.6, 0],
              y: [0, jitter[i].y, jitter[i].y * -0.6, 0],
              rotate: [0, jitter[i].r, -jitter[i].r * 0.5, 0],
              opacity: 1,
              scale: 1,
            }}
            transition={{ duration: 1.5, ease: [0.45, 0, 0.15, 1], delay: i * 0.05 }}
          >
            {name.slice(0, 2).toUpperCase()}
          </motion.span>
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-paper-faint">Berechne faire Paarung…</p>
    </div>
  )
}
