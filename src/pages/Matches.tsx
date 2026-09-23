import { PencilSimple, Trash } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { MatchForm } from '../components/forms/MatchForm'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { formatDate } from '../lib/format'
import { summarizeSets } from '../lib/sets'
import { useLeagueStore } from '../store/useLeagueStore'
import { useToast } from '../components/ui/Toast'
import type { Match } from '../types'

export function Matches() {
  const { matches, seasons, players, playerById } = useLeague()
  const deleteMatch = useLeagueStore((s) => s.deleteMatch)
  const toast = useToast()

  const [seasonFilter, setSeasonFilter] = useState('')
  const [playerFilter, setPlayerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editing, setEditing] = useState<Match | null>(null)
  const [deleting, setDeleting] = useState<Match | null>(null)

  const filtered = useMemo(() => {
    let list = matches
    if (seasonFilter) list = list.filter((m) => m.seasonId === seasonFilter)
    if (playerFilter) list = list.filter((m) => [...m.team1, ...m.team2].includes(playerFilter))
    if (dateFrom) list = list.filter((m) => m.date >= dateFrom)
    if (dateTo) list = list.filter((m) => m.date <= dateTo)
    return [...list].sort((a, b) => (sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
  }, [matches, seasonFilter, playerFilter, dateFrom, dateTo, sortDir])

  const nameOf = (id: string) => playerById.get(id)?.name ?? id

  return (
    <div className="mx-auto max-w-7xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading kicker="Archiv" title="Match-Historie" lede="Jedes gespielte Doppel — filterbar, sortierbar und jederzeit korrigierbar." />

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="rounded-full border border-hairline-strong bg-surface px-4 py-2 text-xs text-paper outline-none focus:border-clay"
        >
          <option value="">Alle Saisons</option>
          {[...seasons].reverse().map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
          className="rounded-full border border-hairline-strong bg-surface px-4 py-2 text-xs text-paper outline-none focus:border-clay"
        >
          <option value="">Alle Spieler</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Von Datum"
          className="rounded-full border border-hairline-strong bg-surface px-4 py-2 text-xs text-paper outline-none focus:border-clay"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Bis Datum"
          className="rounded-full border border-hairline-strong bg-surface px-4 py-2 text-xs text-paper outline-none focus:border-clay"
        />
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="cursor-pointer rounded-full border border-hairline-strong px-4 py-2 text-xs text-paper-dim hover:text-clay"
        >
          Datum {sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <span className="ml-auto text-xs text-paper-faint">{filtered.length} Matches</span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-hairline">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface/40 text-left text-[11px] uppercase tracking-wide text-paper-faint">
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Team 1</th>
              <th className="px-4 py-3 font-medium">Team 2</th>
              <th className="px-4 py-3 font-medium">Sätze</th>
              <th className="px-4 py-3 font-medium">Saison</th>
              <th className="px-4 py-3 font-medium text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const { winner, setsA, setsB } = summarizeSets(m.sets)
              const season = seasons.find((s) => s.id === m.seasonId)
              return (
                <tr key={m.id} className="border-b border-hairline last:border-b-0 hover:bg-surface/30">
                  <td className="px-4 py-3.5 tabular text-paper-dim">{formatDate(m.date)}</td>
                  <td className={clsx('px-4 py-3.5', winner === 'A' ? 'text-court' : 'text-paper-dim')}>
                    {nameOf(m.team1[0])} / {nameOf(m.team1[1])}
                  </td>
                  <td className={clsx('px-4 py-3.5', winner === 'B' ? 'text-court' : 'text-paper-dim')}>
                    {nameOf(m.team2[0])} / {nameOf(m.team2[1])}
                  </td>
                  <td className="px-4 py-3.5 tabular text-paper">
                    {m.sets.map((s) => `${s.a}:${s.b}`).join(', ')}
                    <span className="ml-2 text-xs text-paper-faint">
                      ({setsA}:{setsB})
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={season?.active ? 'clay' : 'neutral'}>{season?.name ?? m.seasonId}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(m)}
                        aria-label="Match bearbeiten"
                        className="cursor-pointer rounded-full p-2 text-paper-dim transition-colors hover:bg-paper/10 hover:text-paper"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(m)}
                        aria-label="Match löschen"
                        className="cursor-pointer rounded-full p-2 text-paper-dim transition-colors hover:bg-loss/10 hover:text-loss"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-paper-faint">
                  Keine Matches für diese Filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Match bearbeiten">
        {editing && <MatchForm existing={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Match löschen"
        description={
          deleting
            ? `Das Match vom ${formatDate(deleting.date)} wird endgültig gelöscht und alle Elo-Werte danach neu berechnet.`
            : ''
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMatch(deleting.id)
            toast.push('Match gelöscht.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
