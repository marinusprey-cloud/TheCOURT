import { Plus, UserCircleMinus, UserCirclePlus } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useToast } from '../components/ui/Toast'
import { useLeague } from '../hooks/useLeague'
import { formatDate } from '../lib/format'
import { useLeagueStore } from '../store/useLeagueStore'

export function League() {
  const { players, seasons, activeSeason, stats } = useLeague()
  const addPlayer = useLeagueStore((s) => s.addPlayer)
  const setPlayerActive = useLeagueStore((s) => s.setPlayerActive)
  const startSeason = useLeagueStore((s) => s.startSeason)
  const endSeason = useLeagueStore((s) => s.endSeason)
  const toast = useToast()

  const [newName, setNewName] = useState('')
  const [newJoined, setNewJoined] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)

  const [newSeasonName, setNewSeasonName] = useState('')
  const [seasonError, setSeasonError] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    setPlayerError(null)
    const result = addPlayer(newName, newJoined || undefined)
    if (!result.ok) {
      setPlayerError(result.error)
      return
    }
    toast.push(`${newName.trim()} wurde zur Liga hinzugefügt.`)
    setNewName('')
    setNewJoined('')
  }

  const handleStartSeason = (e: React.FormEvent) => {
    e.preventDefault()
    setSeasonError(null)
    const result = startSeason(newSeasonName)
    if (!result.ok) {
      setSeasonError(result.error)
      return
    }
    toast.push(`Saison "${newSeasonName.trim()}" gestartet.`)
    setNewSeasonName('')
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading kicker="Verwaltung" title="Liga verwalten" lede="Spieler, Saisons und die Grundlagen der Liga an einem Ort." />

      {/* SEASON MANAGEMENT */}
      <div className="mt-14">
        <h2 className="font-display mb-5 text-2xl font-light text-paper">Saison-Management</h2>
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-paper-faint">Aktuell laufend</p>
              <p className="font-display mt-1 text-2xl font-light text-paper">{activeSeason?.name ?? '—'}</p>
              {activeSeason && (
                <p className="mt-1 text-xs text-paper-dim">seit {formatDate(activeSeason.startDate)}</p>
              )}
            </div>
            {activeSeason && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmEnd(true)} magnetic={false}>
                Saison beenden
              </Button>
            )}
          </div>
        </Card>

        <form onSubmit={handleStartSeason} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">
              Neue Saison starten
            </span>
            <input
              value={newSeasonName}
              onChange={(e) => setNewSeasonName(e.target.value)}
              placeholder='z.B. "Sommer 2026"'
              required
              className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
            />
          </label>
          <Button type="submit" size="md" magnetic={false}>
            <Plus size={15} weight="bold" /> Starten
          </Button>
        </form>
        {seasonError && <p className="mt-2 text-xs text-loss">{seasonError}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          {[...seasons].reverse().map((s) => (
            <Badge key={s.id} tone={s.active ? 'clay' : 'neutral'}>
              {s.name}
              {s.active ? ' · laufend' : ' · archiviert'}
            </Badge>
          ))}
        </div>
      </div>

      {/* PLAYER MANAGEMENT */}
      <div className="mt-16">
        <h2 className="font-display mb-5 text-2xl font-light text-paper">Spieler verwalten</h2>

        <form onSubmit={handleAddPlayer} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[180px]">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">Name</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Neuer Spieler"
              required
              className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
            />
          </label>
          <label className="min-w-[160px]">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-paper-dim">
              Startdatum (optional)
            </span>
            <input
              type="date"
              value={newJoined}
              onChange={(e) => setNewJoined(e.target.value)}
              className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-paper outline-none focus:border-clay"
            />
          </label>
          <Button type="submit" size="md" magnetic={false}>
            <Plus size={15} weight="bold" /> Hinzufügen
          </Button>
        </form>
        {playerError && <p className="mt-2 text-xs text-loss">{playerError}</p>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline">
          {players.map((p) => {
            const s = stats.get(p.id)
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-paper">{p.name}</span>
                  {!p.active && <Badge tone="neutral">Inaktiv</Badge>}
                  {s?.isNew && p.active && <Badge tone="clay">Neu</Badge>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="tabular text-xs text-paper-faint">{s?.matchesPlayed ?? 0} Spiele</span>
                  <button
                    onClick={() => {
                      setPlayerActive(p.id, !p.active)
                      toast.push(p.active ? `${p.name} deaktiviert.` : `${p.name} reaktiviert.`)
                    }}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-clay"
                  >
                    {p.active ? (
                      <>
                        <UserCircleMinus size={16} /> Deaktivieren
                      </>
                    ) : (
                      <>
                        <UserCirclePlus size={16} /> Reaktivieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-paper-faint">
          Deaktivierte Spieler bleiben in der Historie erhalten, erscheinen aber nicht mehr in Ranglisten oder neuen Matches.
        </p>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Saison beenden"
        description={`"${activeSeason?.name}" wird archiviert und für neue Matches gesperrt. Das Abschluss-Ranking bleibt in der Saison-Ansicht sichtbar.`}
        confirmLabel="Saison beenden"
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          if (activeSeason) {
            endSeason(activeSeason.id)
            toast.push(`Saison "${activeSeason.name}" beendet.`)
          }
          setConfirmEnd(false)
        }}
      />
    </div>
  )
}
