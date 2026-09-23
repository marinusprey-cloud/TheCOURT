import { Link } from 'react-router-dom'
import { defById } from '../../lib/achievements'
import type { Unlock } from '../../lib/achievements'
import { TrophyIcon } from './TrophyIcon'

export function PlayerTrophyCase({ unlocks }: { unlocks: Unlock[] }) {
  const uniqueDefs = [...new Map(unlocks.map((u) => [u.defId, u])).values()]

  if (uniqueDefs.length === 0) {
    return (
      <Link to="/trophaeen" className="block text-xs text-paper-faint hover:text-clay">
        Noch keine Trophäen — zur Trophäenkammer →
      </Link>
    )
  }

  return (
    <Link to="/trophaeen" className="group flex flex-wrap items-center gap-2">
      {uniqueDefs.map((u) => {
        const def = defById.get(u.defId)
        if (!def) return null
        return (
          <span
            key={u.defId}
            title={def.name}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-clay/40 bg-clay/10 text-clay transition-transform group-hover:scale-105"
          >
            <TrophyIcon name={def.icon} size={16} weight="fill" />
          </span>
        )
      })}
      <span className="ml-1 text-xs text-paper-faint group-hover:text-clay">Trophäenkammer →</span>
    </Link>
  )
}
