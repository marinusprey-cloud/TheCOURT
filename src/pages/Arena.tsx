import { ArrowsClockwise, Swap } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { PlayerPickChip } from '../components/arena/PlayerPickChip'
import { ShuffleLoader } from '../components/arena/ShuffleLoader'
import { TaleOfTheTape } from '../components/arena/TaleOfTheTape'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useMatchModal } from '../context/MatchModalContext'
import { useLeague } from '../hooks/useLeague'
import { formatDate, formatPercent } from '../lib/format'
import { fairnessLabel, generateFairPairings, type MatchupSuggestion } from '../lib/matchmaking'
import { summarizeSets } from '../lib/sets'
import { useLeagueStore } from '../store/useLeagueStore'

type Phase = 'idle' | 'shuffling' | 'revealed'

export function Arena() {
  const { activePlayers, playerById, elo, matches } = useLeague()
  const arenaSuggestions = useLeagueStore((s) => s.arenaSuggestions)
  const logArenaSuggestion = useLeagueStore((s) => s.logArenaSuggestion)
  const { openAddMatch } = useMatchModal()

  const [selected, setSelected] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [suggestions, setSuggestions] = useState<MatchupSuggestion[]>([])
  const [mainIndex, setMainIndex] = useState(0)

  const toggle = (id: string) => {
    setPhase('idle')
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const canCompute = selected.length >= 4

  const handleCompute = () => {
    if (!canCompute) return
    setPhase('shuffling')
    window.setTimeout(() => {
      const result = generateFairPairings(selected, elo.current, matches, 3)
      setSuggestions(result)
      setMainIndex(0)
      setPhase('revealed')
    }, 1500)
  }

  const main = suggestions[mainIndex]

  const handleStart = (team1: [string, string], team2: [string, string], expectedA: number) => {
    logArenaSuggestion(team1, team2, expectedA)
    openAddMatch({ team1, team2 })
  }

  const history = useMemo(() => {
    return arenaSuggestions
      .map((s) => {
        const result = s.resultMatchId ? matches.find((m) => m.id === s.resultMatchId) : undefined
        let outcome: 'close' | 'blowout' | 'upset' | null = null
        if (result) {
          const { setsA, setsB } = summarizeSets(result.sets)
          const predictedFavoriteWasA = s.expectedA >= 0.5
          const actualWinnerWasA = setsA > setsB
          if (predictedFavoriteWasA !== actualWinnerWasA) outcome = 'upset'
          else if (Math.abs(setsA - setsB) <= 1) outcome = 'close'
          else outcome = 'blowout'
        }
        return { suggestion: s, result, outcome }
      })
      .slice(0, 8)
  }, [arenaSuggestions, matches])

  const name = (id: string) => playerById.get(id)?.name ?? id

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading
        kicker="Die Arena"
        title="Wer ist heute da?"
        lede="Wähle die anwesenden Spieler — die Arena berechnet daraus die fairste Doppel-Paarung, basierend auf dem aktuellen Elo-Stand."
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {activePlayers.map((p) => (
          <PlayerPickChip
            key={p.id}
            name={p.name}
            elo={elo.current[p.id] ?? 1000}
            selected={selected.includes(p.id)}
            onToggle={() => toggle(p.id)}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={handleCompute} disabled={!canCompute}>
          Faire Paarung berechnen
        </Button>
        <span className="text-xs text-paper-faint">
          {selected.length === 0
            ? 'Noch niemand ausgewählt.'
            : selected.length < 4
              ? `${selected.length} ausgewählt — mindestens 4 nötig.`
              : `${selected.length} ausgewählt.`}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'shuffling' && (
          <motion.div key="shuffle" exit={{ opacity: 0 }} className="mt-16">
            <ShuffleLoader names={selected.map(name)} />
          </motion.div>
        )}

        {phase === 'revealed' && main && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-paper-faint">Tale of the Tape</p>
              <p className="flex items-center gap-1.5 text-xs text-paper-faint">
                <Swap size={13} /> Spieler per Drag &amp; Drop tauschen
              </p>
            </div>

            <TaleOfTheTape
              key={main.id}
              suggestion={main}
              eloMap={elo.current}
              playerById={playerById}
              matches={matches}
              onStartMatch={handleStart}
            />

            {suggestions.length > 1 && (
              <div className="mt-8">
                <p className="mb-3 text-xs uppercase tracking-wide text-paper-faint">Weitere faire Vorschläge</p>
                <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setMainIndex(i)}
                      className={`flex shrink-0 snap-start flex-col items-start gap-1 rounded-2xl border px-5 py-4 text-left transition-colors ${
                        i === mainIndex ? 'border-clay bg-clay/10' : 'border-hairline-strong bg-surface hover:border-hairline-strong'
                      }`}
                    >
                      <span className="text-sm text-paper">
                        {name(s.team1[0])} / {name(s.team1[1])}
                      </span>
                      <span className="text-xs text-paper-faint">vs</span>
                      <span className="text-sm text-paper">
                        {name(s.team2[0])} / {name(s.team2[1])}
                      </span>
                      <span className="tabular mt-1 text-xs text-clay">
                        {formatPercent(s.expectedA, 0)} : {formatPercent(1 - s.expectedA, 0)} · {fairnessLabel(s.expectedA)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mt-24 border-t border-hairline pt-12">
          <div className="mb-6 flex items-center gap-2">
            <ArrowsClockwise size={16} className="text-paper-dim" />
            <h2 className="font-display text-xl font-light text-paper">Bisherige Arena-Vorschläge</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-hairline">
            {history.map(({ suggestion, result, outcome }) => (
              <div key={suggestion.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5 text-sm last:border-b-0">
                <span className="text-paper-dim">
                  {name(suggestion.team1[0])} / {name(suggestion.team1[1])}{' '}
                  <span className="text-paper-faint">vs</span> {name(suggestion.team2[0])} / {name(suggestion.team2[1])}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular text-xs text-paper-faint">
                    Prognose {formatPercent(suggestion.expectedA, 0)}:{formatPercent(1 - suggestion.expectedA, 0)}
                  </span>
                  {result ? (
                    <Badge tone={outcome === 'upset' ? 'loss' : outcome === 'close' ? 'court' : 'neutral'}>
                      {outcome === 'upset' ? 'Überraschung' : outcome === 'close' ? 'Knapp — wie erwartet' : 'Deutlich'}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Noch nicht gespielt</Badge>
                  )}
                  <span className="text-xs text-paper-faint">{formatDate(suggestion.createdAt.slice(0, 10))}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
