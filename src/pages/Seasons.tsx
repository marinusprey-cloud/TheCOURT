import { Trophy } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { computeElo } from '../lib/elo'
import { formatDate, formatPercent, today } from '../lib/format'
import { computeSeasonStandings } from '../lib/stats'

export function Seasons() {
  const { players, matches, seasons, playerById } = useLeague()
  const ordered = useMemo(() => [...seasons].sort((a, b) => b.startDate.localeCompare(a.startDate)), [seasons])
  const [selectedId, setSelectedId] = useState(ordered[0]?.id ?? '')
  const season = ordered.find((s) => s.id === selectedId) ?? ordered[0]

  const standings = useMemo(() => {
    if (!season) return []
    const eloBefore = computeElo(players, matches.filter((m) => m.date < season.startDate)).current
    const cutoff = season.endDate ?? today()
    const eloAfter = computeElo(players, matches.filter((m) => m.date <= cutoff)).current
    return computeSeasonStandings(players, matches, season, eloBefore, eloAfter)
  }, [season, players, matches])

  if (!season) {
    return (
      <div className="mx-auto max-w-4xl px-5 pb-32 pt-36 text-center sm:px-8">
        <p className="text-paper-dim">Noch keine Saison angelegt.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading
        kicker="Kapitel"
        title="Die Saison bisher"
        lede="Jede Saison ist ein eigenes Kapitel — mit eigener Rangliste nach Elo-Zuwachs innerhalb dieses Zeitraums."
      />

      <div className="mt-12 flex flex-wrap gap-3">
        {ordered.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={clsx(
              'cursor-pointer rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors',
              s.id === season.id
                ? 'border-clay bg-clay/15 text-clay'
                : 'border-hairline-strong text-paper-dim hover:text-paper',
            )}
          >
            {s.name}
            {s.active && ' · laufend'}
          </button>
        ))}
      </div>

      <motion.div
        key={season.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl font-light text-paper">{season.name}</h3>
            <p className="mt-1 text-sm text-paper-dim">
              {formatDate(season.startDate)} – {season.endDate ? formatDate(season.endDate) : 'laufend'}
            </p>
          </div>
          {season.active ? (
            <Badge tone="clay">Laufende Saison</Badge>
          ) : (
            standings[0] && (
              <div className="flex items-center gap-2 rounded-full border border-clay/30 bg-clay/10 px-4 py-2">
                <Trophy size={16} weight="fill" className="text-clay" />
                <span className="text-sm text-paper">
                  Sieger: <strong className="font-medium">{playerById.get(standings[0].playerId)?.name}</strong>
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-hairline">
          <div className="hidden grid-cols-[3rem_1fr_7rem_6rem_6rem_6rem] gap-4 border-b border-hairline bg-surface/40 px-6 py-3 text-[11px] uppercase tracking-wide text-paper-faint sm:grid">
            <span>#</span>
            <span>Spieler</span>
            <span className="text-right">Elo-Δ Saison</span>
            <span className="text-right">Elo (Ende)</span>
            <span className="text-right">Bilanz</span>
            <span className="text-right">Winrate</span>
          </div>
          {standings.map((row, i) => (
            <div
              key={row.playerId}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-hairline px-6 py-4 text-sm last:border-b-0 sm:grid-cols-[3rem_1fr_7rem_6rem_6rem_6rem]"
            >
              <span className="font-display tabular text-paper-dim">{i + 1}</span>
              <span className="flex items-center gap-2 text-paper">
                {playerById.get(row.playerId)?.name}
                {i === 0 && !season.active && <Trophy size={14} weight="fill" className="text-clay" />}
              </span>
              <span className={clsx('hidden text-right tabular sm:block', row.eloDelta >= 0 ? 'text-court' : 'text-loss')}>
                {row.eloDelta >= 0 ? '+' : ''}
                {Math.round(row.eloDelta)}
              </span>
              <span className="hidden text-right tabular text-paper-dim sm:block">{Math.round(row.eloEnd)}</span>
              <span className="hidden text-right tabular text-paper-dim sm:block">
                {row.wins}–{row.played - row.wins}
              </span>
              <span className="hidden text-right tabular text-paper-dim sm:block">{formatPercent(row.winRate)}</span>
            </div>
          ))}
          {standings.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-paper-faint">Noch keine Matches in dieser Saison.</p>
          )}
        </div>

        <Card className="mt-6 p-6">
          <p className="text-xs uppercase tracking-wide text-paper-faint">Matches in dieser Saison</p>
          <p className="font-display tabular mt-2 text-3xl font-light text-paper">
            {matches.filter((m) => m.seasonId === season.id).length}
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
