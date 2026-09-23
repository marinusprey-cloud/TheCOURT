import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { formatPercent } from '../lib/format'
import { computeHeadToHead } from '../lib/stats'

export function HeadToHead() {
  const { activePlayers, elo, stats, matches } = useLeague()
  const [aId, setAId] = useState(activePlayers[0]?.id ?? '')
  const [bId, setBId] = useState(activePlayers[1]?.id ?? activePlayers[0]?.id ?? '')

  const h2h = useMemo(() => (aId && bId ? computeHeadToHead(aId, bId, matches) : null), [aId, bId, matches])
  const playerA = activePlayers.find((p) => p.id === aId)
  const playerB = activePlayers.find((p) => p.id === bId)
  const statsA = stats.get(aId)
  const statsB = stats.get(bId)

  const total = h2h ? h2h.asOpponents.played : 0
  const aShare = total ? h2h!.asOpponents.aWins / total : 0.5

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading
        kicker="Direktvergleich"
        title="Kopf an Kopf"
        lede="Zwei Spieler, eine Bilanz. Direkte Duelle und gemeinsame Auftritte als Partner."
      />

      <div className="mt-10 flex flex-wrap gap-4">
        <PlayerSelect label="Spieler A" value={aId} onChange={setAId} options={activePlayers} />
        <PlayerSelect label="Spieler B" value={bId} onChange={setBId} options={activePlayers} />
      </div>

      {playerA && playerB && h2h && (
        <motion.div
          key={`${aId}-${bId}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-14"
        >
          {aId === bId ? (
            <p className="text-center text-paper-dim">Bitte zwei unterschiedliche Spieler wählen.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 items-center gap-6 sm:gap-10">
                <div className="text-right">
                  <p className="font-display text-4xl font-light text-paper sm:text-6xl">{playerA.name}</p>
                  <p className="mt-2 tabular text-clay">{Math.round(elo.current[aId] ?? 1000)} Elo</p>
                </div>
                <div className="text-left">
                  <p className="font-display text-4xl font-light text-paper sm:text-6xl">{playerB.name}</p>
                  <p className="mt-2 tabular text-clay">{Math.round(elo.current[bId] ?? 1000)} Elo</p>
                </div>
              </div>

              <div className="mx-auto mt-10 max-w-xl">
                <div className="flex items-center justify-center gap-4">
                  <span className="font-display tabular text-6xl font-light text-court sm:text-8xl">
                    {h2h.asOpponents.aWins}
                  </span>
                  <span className="font-display text-3xl text-paper-faint">:</span>
                  <span className="font-display tabular text-6xl font-light text-loss sm:text-8xl">
                    {h2h.asOpponents.bWins}
                  </span>
                </div>
                <p className="mt-3 text-center text-xs uppercase tracking-wide text-paper-faint">
                  {total} direkte Duelle als Gegner
                </p>
                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full bg-court"
                    initial={{ width: 0 }}
                    animate={{ width: `${aShare * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              <div className="mt-14 grid gap-4 sm:grid-cols-3">
                <Card className="p-6 text-center">
                  <p className="text-xs uppercase tracking-wide text-paper-faint">Als Partner zusammen</p>
                  <p className="font-display tabular mt-2 text-3xl font-light text-paper">
                    {h2h.asPartners.played ? `${h2h.asPartners.wins}–${h2h.asPartners.played - h2h.asPartners.wins}` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-paper-faint">
                    {h2h.asPartners.played ? `${h2h.asPartners.played} gemeinsame Spiele` : 'Noch nie gemeinsam gespielt'}
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <p className="text-xs uppercase tracking-wide text-paper-faint">Winrate {playerA.name}</p>
                  <p className="font-display tabular mt-2 text-3xl font-light text-paper">
                    {statsA ? formatPercent(statsA.winRate) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-paper-faint">gesamt, alle Matches</p>
                </Card>
                <Card className="p-6 text-center">
                  <p className="text-xs uppercase tracking-wide text-paper-faint">Winrate {playerB.name}</p>
                  <p className="font-display tabular mt-2 text-3xl font-light text-paper">
                    {statsB ? formatPercent(statsB.winRate) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-paper-faint">gesamt, alle Matches</p>
                </Card>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

function PlayerSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; name: string }[]
}) {
  return (
    <label className="flex-1 min-w-[180px]">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}
