import type { Match, Player, Season } from '../types'
import { summarizeSets } from './sets'

export interface PlayerMatchRecord {
  match: Match
  team: 'A' | 'B'
  partnerId: string
  opponentIds: [string, string]
  won: boolean
  wentToThree: boolean
}

export function matchesForPlayer(playerId: string, matches: Match[]): PlayerMatchRecord[] {
  const records: PlayerMatchRecord[] = []
  for (const match of matches) {
    const inTeam1 = match.team1.includes(playerId)
    const inTeam2 = match.team2.includes(playerId)
    if (!inTeam1 && !inTeam2) continue
    const team: 'A' | 'B' = inTeam1 ? 'A' : 'B'
    const [own, opp] = team === 'A' ? [match.team1, match.team2] : [match.team2, match.team1]
    const partnerId = own[0] === playerId ? own[1] : own[0]
    const { winner, wentToThree } = summarizeSets(match.sets)
    records.push({
      match,
      team,
      partnerId,
      opponentIds: opp,
      won: winner === team,
      wentToThree,
    })
  }
  return records
}

interface PairSplit {
  played: number
  wins: number
  winRate: number
}

function accumulate(map: Map<string, { played: number; wins: number }>, id: string, won: boolean) {
  const entry = map.get(id) ?? { played: 0, wins: 0 }
  entry.played += 1
  if (won) entry.wins += 1
  map.set(id, entry)
}

export interface PlayerStats {
  playerId: string
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
  currentStreak: { type: 'win' | 'loss' | 'none'; length: number }
  avgSetsPerMatch: number
  clutch: { winRate: number; played: number }
  isNew: boolean
  seasonStats: Record<string, { played: number; wins: number; winRate: number }>
  partners: Record<string, PairSplit>
  opponents: Record<string, PairSplit>
  bestPartner: { id: string; winRate: number; played: number } | null
  toughestOpponent: { id: string; winRate: number; played: number } | null
  easiestOpponent: { id: string; winRate: number; played: number } | null
  form: ('win' | 'loss')[] // chronological ascending, most recent last, max 5
}

const NEW_PLAYER_THRESHOLD = 3
const MIN_PAIR_SAMPLE = 2

export function computePlayerStats(playerId: string, matches: Match[], seasons: Season[]): PlayerStats {
  const records = matchesForPlayer(playerId, matches).sort((a, b) => a.match.date.localeCompare(b.match.date))
  const matchesPlayed = records.length
  const wins = records.filter((r) => r.won).length
  const losses = matchesPlayed - wins
  const winRate = matchesPlayed ? wins / matchesPlayed : 0

  let currentStreak: PlayerStats['currentStreak'] = { type: 'none', length: 0 }
  for (let i = records.length - 1; i >= 0; i--) {
    const type = records[i].won ? 'win' : 'loss'
    if (currentStreak.type === 'none') {
      currentStreak = { type, length: 1 }
    } else if (currentStreak.type === type) {
      currentStreak.length += 1
    } else break
  }

  const totalSets = records.reduce((sum, r) => sum + r.match.sets.length, 0)
  const avgSetsPerMatch = matchesPlayed ? totalSets / matchesPlayed : 0

  const threeSetters = records.filter((r) => r.wentToThree)
  const clutch = {
    played: threeSetters.length,
    winRate: threeSetters.length ? threeSetters.filter((r) => r.won).length / threeSetters.length : 0,
  }

  const seasonStats: PlayerStats['seasonStats'] = {}
  for (const season of seasons) {
    const seasonRecords = records.filter((r) => r.match.seasonId === season.id)
    seasonStats[season.id] = {
      played: seasonRecords.length,
      wins: seasonRecords.filter((r) => r.won).length,
      winRate: seasonRecords.length ? seasonRecords.filter((r) => r.won).length / seasonRecords.length : 0,
    }
  }

  const partnerMap = new Map<string, { played: number; wins: number }>()
  const opponentMap = new Map<string, { played: number; wins: number }>()
  for (const r of records) {
    accumulate(partnerMap, r.partnerId, r.won)
    for (const oppId of r.opponentIds) accumulate(opponentMap, oppId, r.won)
  }

  const toSplit = (m: Map<string, { played: number; wins: number }>): Record<string, PairSplit> => {
    const out: Record<string, PairSplit> = {}
    for (const [id, v] of m) out[id] = { ...v, winRate: v.played ? v.wins / v.played : 0 }
    return out
  }
  const partners = toSplit(partnerMap)
  const opponents = toSplit(opponentMap)

  const eligiblePartners = Object.entries(partners).filter(([, v]) => v.played >= MIN_PAIR_SAMPLE)
  const bestPartner = eligiblePartners.length
    ? eligiblePartners.reduce((a, b) => (b[1].winRate > a[1].winRate ? b : a))
    : null

  const eligibleOpponents = Object.entries(opponents).filter(([, v]) => v.played >= MIN_PAIR_SAMPLE)
  const toughestOpponent = eligibleOpponents.length
    ? eligibleOpponents.reduce((a, b) => (b[1].winRate < a[1].winRate ? b : a))
    : null
  const easiestOpponent = eligibleOpponents.length
    ? eligibleOpponents.reduce((a, b) => (b[1].winRate > a[1].winRate ? b : a))
    : null

  return {
    playerId,
    matchesPlayed,
    wins,
    losses,
    winRate,
    currentStreak,
    avgSetsPerMatch,
    clutch,
    isNew: matchesPlayed < NEW_PLAYER_THRESHOLD,
    seasonStats,
    partners,
    opponents,
    bestPartner: bestPartner ? { id: bestPartner[0], ...bestPartner[1] } : null,
    toughestOpponent: toughestOpponent ? { id: toughestOpponent[0], ...toughestOpponent[1] } : null,
    easiestOpponent: easiestOpponent ? { id: easiestOpponent[0], ...easiestOpponent[1] } : null,
    form: records.slice(-5).map((r) => (r.won ? 'win' : 'loss')),
  }
}

export interface HeadToHead {
  playerAId: string
  playerBId: string
  asOpponents: { played: number; aWins: number; bWins: number }
  asPartners: { played: number; wins: number }
}

export function computeHeadToHead(aId: string, bId: string, matches: Match[]): HeadToHead {
  let played = 0
  let aWins = 0
  let bWins = 0
  let partnerPlayed = 0
  let partnerWins = 0
  for (const match of matches) {
    const aTeam = match.team1.includes(aId) ? 'A' : match.team2.includes(aId) ? 'B' : null
    const bTeam = match.team1.includes(bId) ? 'A' : match.team2.includes(bId) ? 'B' : null
    if (!aTeam || !bTeam) continue
    if (aTeam === bTeam) {
      partnerPlayed += 1
      const { winner } = summarizeSets(match.sets)
      if (winner === aTeam) partnerWins += 1
      continue
    }
    played += 1
    const { winner } = summarizeSets(match.sets)
    if (winner === aTeam) aWins += 1
    else bWins += 1
  }
  return {
    playerAId: aId,
    playerBId: bId,
    asOpponents: { played, aWins, bWins },
    asPartners: { played: partnerPlayed, wins: partnerWins },
  }
}

export interface PartnerChemistry {
  pairId: string
  playerAId: string
  playerBId: string
  played: number
  wins: number
  winRate: number
}

export function computePartnerChemistry(matches: Match[]): PartnerChemistry[] {
  const map = new Map<string, { a: string; b: string; played: number; wins: number }>()
  for (const match of matches) {
    for (const team of [match.team1, match.team2] as const) {
      const [x, y] = [...team].sort()
      const key = `${x}__${y}`
      const entry = map.get(key) ?? { a: x, b: y, played: 0, wins: 0 }
      entry.played += 1
      const { winner } = summarizeSets(match.sets)
      const teamLabel = team === match.team1 ? 'A' : 'B'
      if (winner === teamLabel) entry.wins += 1
      map.set(key, entry)
    }
  }
  return [...map.entries()]
    .map(([pairId, v]) => ({
      pairId,
      playerAId: v.a,
      playerBId: v.b,
      played: v.played,
      wins: v.wins,
      winRate: v.played ? v.wins / v.played : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.played - a.played)
}

export function overallWinRate(playerId: string, matches: Match[]): number {
  const records = matchesForPlayer(playerId, matches)
  if (!records.length) return 0
  return records.filter((r) => r.won).length / records.length
}

/** Players ranked by how much Elo they gained/lost strictly within one season. */
export interface SeasonStanding {
  playerId: string
  eloDelta: number
  eloEnd: number
  played: number
  wins: number
  winRate: number
}

export function computeSeasonStandings(
  players: Player[],
  matches: Match[],
  season: Season,
  eloBefore: Record<string, number>,
  eloAfter: Record<string, number>,
): SeasonStanding[] {
  const seasonMatches = matches.filter((m) => m.seasonId === season.id)
  return players
    .map((p) => {
      const records = matchesForPlayer(p.id, seasonMatches)
      return {
        playerId: p.id,
        eloDelta: (eloAfter[p.id] ?? 1000) - (eloBefore[p.id] ?? 1000),
        eloEnd: eloAfter[p.id] ?? 1000,
        played: records.length,
        wins: records.filter((r) => r.won).length,
        winRate: records.length ? records.filter((r) => r.won).length / records.length : 0,
      }
    })
    .filter((s) => s.played > 0)
    .sort((a, b) => b.eloDelta - a.eloDelta)
}
