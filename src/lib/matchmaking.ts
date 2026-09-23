import type { Match } from '../types'
import { summarizeSets } from './sets'

export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + 10 ** ((eloB - eloA) / 400))
}

export function teamElo(eloMap: Record<string, number>, team: [string, string]): number {
  return ((eloMap[team[0]] ?? 1000) + (eloMap[team[1]] ?? 1000)) / 2
}

export type FairnessLabel = 'Sehr ausgeglichen' | 'Leichter Favorit' | 'Klarer Favorit'

export function fairnessLabel(expectedA: number): FairnessLabel {
  const gap = Math.abs(expectedA - 0.5)
  if (gap <= 0.05) return 'Sehr ausgeglichen'
  if (gap <= 0.15) return 'Leichter Favorit'
  return 'Klarer Favorit'
}

export interface PairFacts {
  played: number
  winStreak: number
  unbeaten: boolean
  loseStreak: number
}

/** Chronological facts about two players as teammates: current streak, unbeaten status. */
export function pairFacts(aId: string, bId: string, matches: Match[]): PairFacts {
  const together = matches
    .filter(
      (m) =>
        (m.team1.includes(aId) && m.team1.includes(bId)) || (m.team2.includes(aId) && m.team2.includes(bId)),
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  if (together.length === 0) {
    return { played: 0, winStreak: 0, loseStreak: 0, unbeaten: false }
  }

  const results = together.map((m) => {
    const team = m.team1.includes(aId) ? 'A' : 'B'
    return summarizeSets(m.sets).winner === team
  })

  let winStreak = 0
  let loseStreak = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (i === results.length - 1) {
      if (results[i]) winStreak = 1
      else loseStreak = 1
      continue
    }
    if (winStreak > 0) {
      if (results[i]) winStreak++
      else break
    } else {
      if (!results[i]) loseStreak++
      else break
    }
  }

  const wins = results.filter(Boolean).length
  return { played: together.length, winStreak, loseStreak, unbeaten: together.length >= 2 && wins === together.length }
}

export interface MatchupSuggestion {
  id: string
  team1: [string, string]
  team2: [string, string]
  bench: string[]
  expectedA: number
  fairness: FairnessLabel
  team1Facts: PairFacts
  team2Facts: PairFacts
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c])
  const withoutFirst = combinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

/**
 * Evaluates every possible 4-player subset of `selectedIds` (bench the rest)
 * and every 2v2 split within that subset, ranks them by how close the
 * expected result is to 50/50, and returns the top `limit` distinct subsets
 * (each shown with its fairest internal split).
 */
export function generateFairPairings(
  selectedIds: string[],
  eloMap: Record<string, number>,
  matches: Match[],
  limit = 3,
): MatchupSuggestion[] {
  if (selectedIds.length < 4) return []

  const subsets = combinations(selectedIds, 4)
  const bestPerSubset: { subset: string[]; team1: [string, string]; team2: [string, string]; expectedA: number; fairness: number }[] =
    []

  for (const subset of subsets) {
    const [p1, p2, p3, p4] = subset
    const splits: [[string, string], [string, string]][] = [
      [
        [p1, p2],
        [p3, p4],
      ],
      [
        [p1, p3],
        [p2, p4],
      ],
      [
        [p1, p4],
        [p2, p3],
      ],
    ]
    let best: (typeof bestPerSubset)[number] | null = null
    for (const [team1, team2] of splits) {
      const expectedA = expectedScore(teamElo(eloMap, team1), teamElo(eloMap, team2))
      const fairness = Math.abs(expectedA - 0.5)
      if (!best || fairness < best.fairness) {
        best = { subset, team1, team2, expectedA, fairness }
      }
    }
    if (best) bestPerSubset.push(best)
  }

  bestPerSubset.sort((a, b) => a.fairness - b.fairness)

  return bestPerSubset.slice(0, limit).map((b, i) => {
    const bench = selectedIds.filter((id) => !b.subset.includes(id))
    return {
      id: `${b.team1.join('-')}_${b.team2.join('-')}_${i}`,
      team1: b.team1,
      team2: b.team2,
      bench,
      expectedA: b.expectedA,
      fairness: fairnessLabel(b.expectedA),
      team1Facts: pairFacts(b.team1[0], b.team1[1], matches),
      team2Facts: pairFacts(b.team2[0], b.team2[1], matches),
    }
  })
}
