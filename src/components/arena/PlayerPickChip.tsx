import { motion } from 'framer-motion'
import clsx from 'clsx'

interface PlayerPickChipProps {
  name: string
  elo: number
  selected: boolean
  onToggle: () => void
}

export function PlayerPickChip({ name, elo, selected, onToggle }: PlayerPickChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={clsx(
        'flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-5 py-4 transition-colors duration-200',
        selected
          ? 'border-clay bg-clay/12 text-paper'
          : 'border-hairline-strong bg-surface text-paper-dim hover:border-hairline-strong hover:text-paper',
      )}
      aria-pressed={selected}
    >
      <span
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-full font-display text-base',
          selected ? 'bg-clay text-ink' : 'bg-surface-3 text-paper-dim',
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-sans text-sm font-medium">{name}</span>
      <span className="tabular text-[11px] text-paper-faint">{Math.round(elo)} Elo</span>
    </motion.button>
  )
}
