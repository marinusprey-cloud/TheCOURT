import { useMemo, useState } from 'react'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { formatPercent } from '../lib/format'
import { computePartnerChemistry } from '../lib/stats'

export function Partners() {
  const { matches, playerById } = useLeague()
  const [minPlayed, setMinPlayed] = useState(2)

  const pairs = useMemo(
    () => computePartnerChemistry(matches).filter((p) => p.played >= minPlayed),
    [matches, minPlayed],
  )

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading
        kicker="Doppel-Chemie"
        title="Partner-Chemie"
        lede="Welche Paarung gewinnt am zuverlässigsten zusammen? Sortiert nach gemeinsamer Siegquote."
      />

      <div className="mt-10 flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-paper-dim" htmlFor="min-played">
          Mindestens gemeinsame Spiele
        </label>
        <input
          id="min-played"
          type="number"
          min={1}
          max={10}
          value={minPlayed}
          onChange={(e) => setMinPlayed(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
          className="w-16 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-center text-sm tabular text-paper outline-none focus:border-clay"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-hairline">
        <div className="hidden grid-cols-[1fr_6rem_6rem_10rem] gap-4 border-b border-hairline bg-surface/40 px-6 py-3 text-[11px] uppercase tracking-wide text-paper-faint sm:grid">
          <span>Paarung</span>
          <span className="text-right">Spiele</span>
          <span className="text-right">Bilanz</span>
          <span className="text-right">Winrate</span>
        </div>
        {pairs.map((p) => (
          <div
            key={p.pairId}
            className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-hairline px-6 py-4 text-sm last:border-b-0 sm:grid-cols-[1fr_6rem_6rem_10rem]"
          >
            <span className="font-display text-lg font-light text-paper">
              {playerById.get(p.playerAId)?.name} <span className="text-paper-faint">&amp;</span>{' '}
              {playerById.get(p.playerBId)?.name}
            </span>
            <span className="hidden text-right tabular text-paper-dim sm:block">{p.played}</span>
            <span className="hidden text-right tabular text-paper-dim sm:block">
              {p.wins}–{p.played - p.wins}
            </span>
            <span className="hidden items-center justify-end gap-3 sm:flex">
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3">
                <span className="block h-full bg-court" style={{ width: `${p.winRate * 100}%` }} />
              </span>
              <span className="tabular text-paper">{formatPercent(p.winRate)}</span>
            </span>
          </div>
        ))}
        {pairs.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-paper-faint">Keine Paarungen mit genug gemeinsamen Spielen.</p>
        )}
      </div>
    </div>
  )
}
