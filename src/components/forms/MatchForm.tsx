import { Plus, Trash, Trophy } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useLeague } from '../../hooks/useLeague'
import { computeAchievements, defById } from '../../lib/achievements'
import { today } from '../../lib/format'
import { summarizeSets, validateSets } from '../../lib/sets'
import { useLeagueStore, type NewMatchInput } from '../../store/useLeagueStore'
import type { Match, SetScore } from '../../types'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface MatchFormProps {
  existing?: Match
  prefillTeams?: { team1: [string, string]; team2: [string, string] }
  onDone: () => void
}

type Slot = 't1a' | 't1b' | 't2a' | 't2b'

export function MatchForm({ existing, prefillTeams, onDone }: MatchFormProps) {
  const { players, playerById, activeSeason, seasons } = useLeague()
  const addMatch = useLeagueStore((s) => s.addMatch)
  const updateMatch = useLeagueStore((s) => s.updateMatch)
  const toast = useToast()

  const [date, setDate] = useState(existing?.date ?? today())
  const [slots, setSlots] = useState<Record<Slot, string>>({
    t1a: existing?.team1[0] ?? prefillTeams?.team1[0] ?? '',
    t1b: existing?.team1[1] ?? prefillTeams?.team1[1] ?? '',
    t2a: existing?.team2[0] ?? prefillTeams?.team2[0] ?? '',
    t2b: existing?.team2[1] ?? prefillTeams?.team2[1] ?? '',
  })
  const [sets, setSets] = useState<SetScore[]>(
    existing?.sets ?? [
      { a: NaN, b: NaN },
      { a: NaN, b: NaN },
    ],
  )
  const [seasonId, setSeasonId] = useState(existing?.seasonId ?? activeSeason?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const selectableOptions = useMemo(() => {
    const active = players.filter((p) => p.active)
    const extras = existing
      ? [...existing.team1, ...existing.team2].map((id) => playerById.get(id)).filter((p) => p && !p.active)
      : []
    return [...active, ...extras].filter((p): p is NonNullable<typeof p> => Boolean(p))
  }, [players, existing, playerById])

  const chosen = Object.values(slots).filter(Boolean)

  const setSlot = (slot: Slot, value: string) => setSlots((s) => ({ ...s, [slot]: value }))

  const setSetValue = (index: number, side: 'a' | 'b', value: string) => {
    setSets((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [side]: value === '' ? NaN : Number.parseInt(value, 10) }
      return next
    })
  }

  const addThirdSet = () => setSets((prev) => [...prev, { a: NaN, b: NaN }])
  const removeThirdSet = () => setSets((prev) => prev.slice(0, 2))

  const previewValidation = validateSets(sets.filter((s) => !Number.isNaN(s.a) && !Number.isNaN(s.b)))
  const complete = sets.every((s) => !Number.isNaN(s.a) && !Number.isNaN(s.b))
  const summary = complete && previewValidation.valid ? summarizeSets(sets) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (chosen.length !== 4 || new Set(chosen).size !== 4) {
      setError('Bitte vier unterschiedliche Spieler auswählen.')
      return
    }
    const input: NewMatchInput = {
      date,
      team1: [slots.t1a, slots.t1b],
      team2: [slots.t2a, slots.t2b],
      sets,
      seasonId: seasonId || undefined,
    }

    const before = useLeagueStore.getState()
    const beforeUnlocked = new Set(
      computeAchievements(before.players, before.matches, before.seasons).unlocks.map((u) => `${u.defId}__${u.playerId}`),
    )

    const result = existing ? updateMatch(existing.id, input) : addMatch(input)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.push(existing ? 'Match aktualisiert.' : 'Match gespeichert — alle Werte wurden neu berechnet.')

    const after = useLeagueStore.getState()
    const newUnlocks = computeAchievements(after.players, after.matches, after.seasons).unlocks.filter(
      (u) => !beforeUnlocked.has(`${u.defId}__${u.playerId}`),
    )
    for (const u of newUnlocks) {
      const def = defById.get(u.defId)
      const name = playerById.get(u.playerId)?.name ?? u.playerId
      if (def) toast.push(`Neue Trophäe für ${name}: „${def.name}“`, 'success')
    }

    onDone()
  }

  const nameOf = (id: string) => playerById.get(id)?.name ?? id

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="match-date" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">
          Datum <span className="text-clay">*</span>
        </label>
        <input
          id="match-date"
          type="date"
          required
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TeamPicker
          label="Team 1"
          options={selectableOptions}
          valueA={slots.t1a}
          valueB={slots.t1b}
          onChangeA={(v) => setSlot('t1a', v)}
          onChangeB={(v) => setSlot('t1b', v)}
          chosen={chosen}
        />
        <TeamPicker
          label="Team 2"
          options={selectableOptions}
          valueA={slots.t2a}
          valueB={slots.t2b}
          onChangeA={(v) => setSlot('t2a', v)}
          onChangeB={(v) => setSlot('t2b', v)}
          chosen={chosen}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-paper-dim">
            Sätze <span className="text-clay">*</span>
          </span>
          {sets.length === 2 ? (
            <button
              type="button"
              onClick={addThirdSet}
              className="flex cursor-pointer items-center gap-1 text-xs text-clay hover:underline"
            >
              <Plus size={13} /> 3. Satz
            </button>
          ) : (
            <button
              type="button"
              onClick={removeThirdSet}
              className="flex cursor-pointer items-center gap-1 text-xs text-paper-dim hover:text-loss"
            >
              <Trash size={13} /> entfernen
            </button>
          )}
        </div>
        <div className="space-y-2">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-xs text-paper-faint">Satz {i + 1}</span>
              <input
                type="number"
                min={0}
                max={7}
                required
                value={Number.isNaN(s.a) ? '' : s.a}
                onChange={(e) => setSetValue(i, 'a', e.target.value)}
                className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-center text-sm tabular text-paper outline-none focus:border-clay"
              />
              <span className="text-paper-faint">:</span>
              <input
                type="number"
                min={0}
                max={7}
                required
                value={Number.isNaN(s.b) ? '' : s.b}
                onChange={(e) => setSetValue(i, 'b', e.target.value)}
                className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-center text-sm tabular text-paper outline-none focus:border-clay"
              />
            </div>
          ))}
        </div>
        {complete && !previewValidation.valid && (
          <p className="mt-2 text-xs text-loss">{previewValidation.error}</p>
        )}
        {summary && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-court">
            <Trophy size={14} weight="fill" />
            Sieger: {summary.winner === 'A' ? `${nameOf(slots.t1a) || 'Team 1'} / ${nameOf(slots.t1b) || ''}` : `${nameOf(slots.t2a) || 'Team 2'} / ${nameOf(slots.t2b) || ''}`}{' '}
            ({summary.setsA}:{summary.setsB})
          </p>
        )}
      </div>

      <div>
        <label htmlFor="match-season" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">
          Saison
        </label>
        <select
          id="match-season"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
        >
          {seasons
            .slice()
            .reverse()
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.active ? ' (laufend)' : ''}
              </option>
            ))}
        </select>
        <p className="mt-1.5 text-xs text-paper-faint">
          Standardmäßig wird die laufende Saison zugeordnet — bei Bedarf hier überschreiben.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone} magnetic={false}>
          Abbrechen
        </Button>
        <Button type="submit" size="sm" magnetic={false}>
          {existing ? 'Änderungen speichern' : 'Match speichern'}
        </Button>
      </div>
    </form>
  )
}

interface TeamPickerProps {
  label: string
  options: { id: string; name: string; active: boolean }[]
  valueA: string
  valueB: string
  onChangeA: (v: string) => void
  onChangeB: (v: string) => void
  chosen: string[]
}

function TeamPicker({ label, options, valueA, valueB, onChangeA, onChangeB, chosen }: TeamPickerProps) {
  const disabledFor = (current: string) => (id: string) => id !== current && chosen.includes(id)
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">
        {label} <span className="text-clay">*</span>
      </span>
      <div className="space-y-2">
        {[
          [valueA, onChangeA],
          [valueB, onChangeB],
        ].map(([value, onChange], i) => (
          <select
            key={i}
            required
            value={value as string}
            onChange={(e) => (onChange as (v: string) => void)(e.target.value)}
            className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
          >
            <option value="">Spieler wählen…</option>
            {options.map((p) => (
              <option key={p.id} value={p.id} disabled={disabledFor(value as string)(p.id)}>
                {p.name}
                {!p.active ? ' (inaktiv)' : ''}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  )
}
