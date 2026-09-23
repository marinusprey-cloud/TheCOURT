import type { SetScore } from '../types'

/** Parses "6:4, 4:6, 6:1" into structured set scores. */
export function parseSetsString(raw: string): SetScore[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [a, b] = s.split(':').map((n) => Number.parseInt(n.trim(), 10))
      return { a, b }
    })
}

export function formatSetsString(sets: SetScore[]): string {
  return sets.map((s) => `${s.a}:${s.b}`).join(', ')
}

/** Valid padel/tennis set scores: 6-0..6-4, 7-5, or 7-6 (tiebreak). No draws. */
export function isValidSet(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false
  if (a < 0 || b < 0 || a === b) return false
  const winner = Math.max(a, b)
  const loser = Math.min(a, b)
  if (winner === 6) return loser <= 4
  if (winner === 7) return loser === 5 || loser === 6
  return false
}

export interface SetsValidation {
  valid: boolean
  error?: string
}

/** Validates a full sequence of sets for a match (best of 3, no dead rubbers). */
export function validateSets(sets: SetScore[]): SetsValidation {
  if (sets.length < 2 || sets.length > 3) {
    return { valid: false, error: 'Ein Match braucht 2 oder 3 Sätze.' }
  }
  for (const [i, set] of sets.entries()) {
    if (!isValidSet(set.a, set.b)) {
      return { valid: false, error: `Satz ${i + 1} ist kein gültiges Ergebnis (z.B. 6:4, 7:5, 7:6).` }
    }
  }
  const setsA = sets.filter((s) => s.a > s.b).length
  const setsB = sets.filter((s) => s.b > s.a).length
  if (sets.length === 2 && setsA === 1 && setsB === 1) {
    return { valid: false, error: 'Bei 1:1 nach zwei Sätzen wird ein dritter Satz benötigt.' }
  }
  return { valid: true }
}

export interface SetsSummary {
  setsA: number
  setsB: number
  winner: 'A' | 'B'
  wentToThree: boolean
}

export function summarizeSets(sets: SetScore[]): SetsSummary {
  const setsA = sets.filter((s) => s.a > s.b).length
  const setsB = sets.filter((s) => s.b > s.a).length
  return {
    setsA,
    setsB,
    winner: setsA > setsB ? 'A' : 'B',
    wentToThree: sets.length === 3,
  }
}
