import { motion } from 'framer-motion'
import type { AchievementDef, Progress, Unlock } from '../../lib/achievements'
import { formatDate } from '../../lib/format'
import type { Player } from '../../types'
import { TrophyIcon } from './TrophyIcon'

interface TrophyCardProps {
  def: AchievementDef
  laureates: Unlock[]
  bestProgress: Progress | null
  playerById: Map<string, Player>
}

export function TrophyCard({ def, laureates, bestProgress, playerById }: TrophyCardProps) {
  const unlocked = laureates.length > 0
  const name = (id: string) => playerById.get(id)?.name ?? id

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-[auto_1fr] items-start gap-6 border-b border-hairline py-10 first:pt-0 last:border-b-0 sm:gap-10"
    >
      <motion.div
        initial={{ opacity: 0, rotateY: -70 }}
        whileInView={{ opacity: 1, rotateY: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ perspective: 600 }}
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border sm:h-20 sm:w-20 ${
          unlocked ? 'border-clay/50 bg-clay/10' : 'border-hairline-strong bg-surface'
        }`}
      >
        <TrophyIcon
          name={def.icon}
          size={30}
          weight={unlocked ? 'fill' : 'regular'}
          className={unlocked ? 'text-clay' : 'text-paper-faint opacity-40'}
        />
      </motion.div>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className={`font-display text-2xl font-light sm:text-3xl ${unlocked ? 'text-paper' : 'text-paper-dim'}`}>
            {def.name}
          </h3>
          <span className="text-[11px] uppercase tracking-wide text-paper-faint">{categoryLabel(def.category)}</span>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-dim">{def.description}</p>

        {unlocked ? (
          <ul className="mt-4 space-y-1.5">
            {laureates.map((u) => (
              <li key={`${u.playerId}-${u.date}-${u.meta?.seasonId ?? ''}`} className="flex items-center gap-2 text-sm">
                <span className="text-clay">{name(u.playerId)}</span>
                {u.date && <span className="tabular text-paper-faint">— {formatDate(u.date)}</span>}
                {u.meta?.seasonName && <span className="text-paper-faint">({u.meta.seasonName})</span>}
              </li>
            ))}
          </ul>
        ) : bestProgress ? (
          <div className="mt-4 max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full bg-paper-faint/50"
                style={{ width: `${Math.min(100, (bestProgress.current / bestProgress.target) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-paper-faint">
              {name(bestProgress.playerId)} — {bestProgress.current} von {bestProgress.target}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-paper-faint">Noch nicht freigeschaltet.</p>
        )}
      </div>
    </motion.div>
  )
}

function categoryLabel(category: AchievementDef['category']): string {
  switch (category) {
    case 'meilenstein':
      return 'Meilenstein'
    case 'rivalitaet':
      return 'Rivalität'
    case 'partner':
      return 'Partner'
    case 'elo':
      return 'Elo'
    case 'saison':
      return 'Saison'
  }
}
