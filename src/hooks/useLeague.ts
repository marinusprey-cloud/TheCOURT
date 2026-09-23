import { useMemo } from 'react'
import { computeElo } from '../lib/elo'
import { computePlayerStats, type PlayerStats } from '../lib/stats'
import { useLeagueStore } from '../store/useLeagueStore'
import type { Player } from '../types'

export interface LeaderboardRow {
  player: Player
  elo: number
  stats: PlayerStats
  rank: number
}

export function useLeague() {
  const players = useLeagueStore((s) => s.players)
  const matches = useLeagueStore((s) => s.matches)
  const seasons = useLeagueStore((s) => s.seasons)

  const elo = useMemo(() => computeElo(players, matches), [players, matches])

  const stats = useMemo(() => {
    const map = new Map<string, PlayerStats>()
    for (const p of players) map.set(p.id, computePlayerStats(p.id, matches, seasons))
    return map
  }, [players, matches, seasons])

  const leaderboard = useMemo<LeaderboardRow[]>(() => {
    return players
      .map((player) => ({ player, elo: elo.current[player.id] ?? 1000, stats: stats.get(player.id)! }))
      .sort((a, b) => b.elo - a.elo)
      .map((row, i) => ({ ...row, rank: i + 1 }))
  }, [players, elo, stats])

  const activeLeaderboard = useMemo(
    () => leaderboard.filter((r) => r.player.active).map((row, i) => ({ ...row, rank: i + 1 })),
    [leaderboard],
  )
  const activePlayers = useMemo(() => players.filter((p) => p.active), [players])
  const activeSeason = useMemo(() => seasons.find((s) => s.active), [seasons])

  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  return {
    players,
    matches,
    seasons,
    elo,
    stats,
    leaderboard,
    activeLeaderboard,
    activePlayers,
    activeSeason,
    playerById,
  }
}
