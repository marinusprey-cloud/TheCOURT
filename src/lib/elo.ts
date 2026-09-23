import type { Match, Player } from '../types'
import { summarizeSets } from './sets'

export const STARTING_ELO = 1000
export const K_BASE = 32
export const K_THREE_SET = 36

export interface EloHistoryPoint {
  date: string
  matchId: string | null
  elo: number
}

export interface EloResult {
  current: Record<string, number>
  history: Record<string, EloHistoryPoint[]>
  matchDelta: Record<string, { deltaA: number; expectedA: number }>
}

/** Sorts matches chronologically (ascending). Same-day order is preserved as entered. */
export function chronological(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Recomputes every player's Elo from scratch, walking matches in chronological
 * order. There is no incremental update path on purpose: with a league this size
 * a full recompute is cheap and guarantees the derived values can never drift
 * from the raw match log.
 */
export function computeElo(players: Player[], matches: Match[]): EloResult {
  const current: Record<string, number> = {}
  const history: EloResult['history'] = {}
  for (const p of players) {
    current[p.id] = STARTING_ELO
    history[p.id] = [{ date: p.joinedDate, matchId: null, elo: STARTING_ELO }]
  }

  const matchDelta: EloResult['matchDelta'] = {}

  for (const match of chronological(matches)) {
    const [a1, a2] = match.team1
    const [b1, b2] = match.team2
    for (const id of [a1, a2, b1, b2]) {
      if (!(id in current)) {
        current[id] = STARTING_ELO
        history[id] = [{ date: match.date, matchId: null, elo: STARTING_ELO }]
      }
    }
    const eloA = (current[a1] + current[a2]) / 2
    const eloB = (current[b1] + current[b2]) / 2
    const expectedA = 1 / (1 + 10 ** ((eloB - eloA) / 400))
    const { winner, wentToThree } = summarizeSets(match.sets)
    const scoreA = winner === 'A' ? 1 : 0
    const k = wentToThree ? K_THREE_SET : K_BASE
    const deltaA = k * (scoreA - expectedA)

    for (const id of [a1, a2]) {
      current[id] += deltaA
      history[id].push({ date: match.date, matchId: match.id, elo: current[id] })
    }
    for (const id of [b1, b2]) {
      current[id] -= deltaA
      history[id].push({ date: match.date, matchId: match.id, elo: current[id] })
    }
    matchDelta[match.id] = { deltaA, expectedA }
  }

  return { current, history, matchDelta }
}

/** Elo standings restricted to matches up to (and including) a cutoff date. */
export function computeEloAsOf(players: Player[], matches: Match[], cutoffDate: string): Record<string, number> {
  const restricted = matches.filter((m) => m.date <= cutoffDate)
  return computeElo(players, restricted).current
}

export interface EloTimelineStep {
  match: Match
  eloBefore: Record<string, number>
  standingsAfter: Record<string, number>
  deltaA: number
  expectedA: number
  winner: 'A' | 'B'
  leaderIdAfter: string
}

/**
 * Replays every match chronologically and captures a full standings snapshot
 * after each one, plus who is in the lead at that point. Used by the
 * achievement engine, which needs "who was #1 on which date" and "how big was
 * this single match's Elo swing" — information the plain current/history
 * result doesn't expose directly.
 */
export function computeEloTimeline(players: Player[], matches: Match[]): EloTimelineStep[] {
  const current: Record<string, number> = {}
  for (const p of players) current[p.id] = STARTING_ELO

  const steps: EloTimelineStep[] = []

  for (const match of chronological(matches)) {
    const [a1, a2] = match.team1
    const [b1, b2] = match.team2
    for (const id of [a1, a2, b1, b2]) {
      if (!(id in current)) current[id] = STARTING_ELO
    }
    const eloBefore = { ...current }
    const eloA = (current[a1] + current[a2]) / 2
    const eloB = (current[b1] + current[b2]) / 2
    const expectedA = 1 / (1 + 10 ** ((eloB - eloA) / 400))
    const { winner, wentToThree } = summarizeSets(match.sets)
    const scoreA = winner === 'A' ? 1 : 0
    const k = wentToThree ? K_THREE_SET : K_BASE
    const deltaA = k * (scoreA - expectedA)

    for (const id of [a1, a2]) current[id] += deltaA
    for (const id of [b1, b2]) current[id] -= deltaA

    let leaderIdAfter = players[0]?.id ?? ''
    for (const id of Object.keys(current)) {
      if (current[id] > (current[leaderIdAfter] ?? -Infinity)) leaderIdAfter = id
    }

    steps.push({ match, eloBefore, standingsAfter: { ...current }, deltaA, expectedA, winner, leaderIdAfter })
  }

  return steps
}
