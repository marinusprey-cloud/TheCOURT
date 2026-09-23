import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PlayerTrophyCase } from '../components/achievements/PlayerTrophyCase'
import { EloChart } from '../components/charts/EloChart'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { FormDots } from '../components/ui/FormDots'
import { useLeague } from '../hooks/useLeague'
import { computeAchievements } from '../lib/achievements'
import { formatPercent } from '../lib/format'

export function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const { players, matches, seasons, playerById, leaderboard, elo, stats } = useLeague()

  const player = id ? playerById.get(id) : undefined

  const playerUnlocks = useMemo(
    () => computeAchievements(players, matches, seasons).unlocks.filter((u) => u.playerId === id),
    [players, matches, seasons, id],
  )

  if (!player) return <Navigate to="/spieler" replace />

  const row = leaderboard.find((r) => r.player.id === player.id)!
  const s = stats.get(player.id)!
  const history = elo.history[player.id] ?? []

  const partnerRows = Object.entries(s.partners)
    .map(([pid, v]) => ({ player: playerById.get(pid), ...v }))
    .filter((r) => r.player)
    .sort((a, b) => b.winRate - a.winRate)

  const opponentRows = Object.entries(s.opponents)
    .map(([pid, v]) => ({ player: playerById.get(pid), ...v }))
    .filter((r) => r.player)
    .sort((a, b) => b.winRate - a.winRate)

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-36 sm:px-8">
      <Link to="/spieler" className="text-xs uppercase tracking-wide text-paper-dim hover:text-clay">
        ← Alle Spieler
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-5xl font-light tracking-tight text-paper sm:text-7xl">{player.name}</h1>
            {s.isNew && <Badge tone="clay">Neu</Badge>}
            {!player.active && <Badge tone="neutral">Inaktiv</Badge>}
          </div>
          <p className="mt-3 text-sm text-paper-dim">
            Rang {row?.rank ?? '—'} · dabei seit {new Date(player.joinedDate).toLocaleDateString('de-DE')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display tabular text-5xl font-light text-clay">{Math.round(row?.elo ?? 1000)}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-paper-faint">Elo-Punkte</p>
        </div>
      </div>

      <div className="mt-6">
        <PlayerTrophyCase unlocks={playerUnlocks} />
      </div>

      <Card className="mt-10 p-6 sm:p-8">
        <p className="mb-6 text-xs uppercase tracking-wide text-paper-faint">Elo-Verlauf</p>
        <EloChart points={history} variant="full" height={220} gradientId={`grad-profile-${player.id}`} />
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Bilanz" value={`${s.wins}–${s.losses}`} />
        <Stat label="Winrate" value={formatPercent(s.winRate)} />
        <Stat label="Ø Sätze / Match" value={s.avgSetsPerMatch.toFixed(1)} />
        <Stat
          label="Clutch-Faktor"
          value={s.clutch.played ? formatPercent(s.clutch.winRate) : '—'}
          hint={s.clutch.played ? `${s.clutch.played} 3-Satz-Matches` : 'Noch keine 3-Satz-Matches'}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-paper-faint">Aktuelle Serie</p>
          <p className="font-display text-2xl font-light text-paper">
            {s.currentStreak.type === 'none'
              ? 'Noch keine Spiele'
              : `${s.currentStreak.length}× in Folge ${s.currentStreak.type === 'win' ? 'gewonnen' : 'verloren'}`}
          </p>
          <div className="mt-4">
            <FormDots form={s.form} />
          </div>
        </Card>
        <Card className="p-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-paper-faint">Bevorzugter Partner</p>
          {s.bestPartner ? (
            <>
              <p className="font-display text-2xl font-light text-paper">{playerById.get(s.bestPartner.id)?.name}</p>
              <p className="mt-1 tabular text-sm text-court">
                {formatPercent(s.bestPartner.winRate)} Siegquote · {s.bestPartner.played} Spiele
              </p>
            </>
          ) : (
            <p className="text-sm text-paper-faint">Noch nicht genug gemeinsame Spiele.</p>
          )}
        </Card>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display mb-5 text-2xl font-light text-paper">Gegner-Bilanz</h2>
          <PairTable rows={opponentRows} emphasize={{ strongest: s.toughestOpponent?.id, easiest: s.easiestOpponent?.id }} />
        </div>
        <div>
          <h2 className="font-display mb-5 text-2xl font-light text-paper">Partner-Bilanz</h2>
          <PairTable rows={partnerRows} />
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display mb-5 text-2xl font-light text-paper">Weitere Spieler</h2>
        <div className="flex flex-wrap gap-2">
          {players
            .filter((p) => p.id !== player.id && p.active)
            .map((p) => (
              <Link
                key={p.id}
                to={`/spieler/${p.id}`}
                className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs text-paper-dim transition-colors hover:border-clay hover:text-clay"
              >
                {p.name}
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-paper-faint">{label}</p>
      <p className="font-display tabular mt-2 text-2xl font-light text-paper">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-paper-faint">{hint}</p>}
    </Card>
  )
}

interface PairRow {
  player?: { id: string; name: string }
  played: number
  wins: number
  winRate: number
}

function PairTable({ rows, emphasize }: { rows: PairRow[]; emphasize?: { strongest?: string; easiest?: string } }) {
  if (!rows.length) return <p className="text-sm text-paper-faint">Noch keine Daten.</p>
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline">
      {rows.map((r) => (
        <Link
          key={r.player!.id}
          to={`/spieler/${r.player!.id}`}
          className="flex items-center justify-between border-b border-hairline px-5 py-3.5 text-sm transition-colors last:border-b-0 hover:bg-surface/50"
        >
          <span className="flex items-center gap-2 text-paper">
            {r.player!.name}
            {emphasize?.strongest === r.player!.id && <Badge tone="loss">Stärkster Gegner</Badge>}
            {emphasize?.easiest === r.player!.id && <Badge tone="court">Leichtester Gegner</Badge>}
          </span>
          <span className="tabular text-paper-dim">
            {r.wins}–{r.played - r.wins} · {formatPercent(r.winRate)}
          </span>
        </Link>
      ))}
    </div>
  )
}
