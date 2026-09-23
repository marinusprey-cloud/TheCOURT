import { slugify } from '../lib/format'
import { parseSetsString } from '../lib/sets'
import type { LeagueTeam, Match, Player, Season } from '../types'
import raw from './raw-matches.json'

/** Canonical roster, in the order the league was originally introduced. */
const CANONICAL_NAMES = ['Marinus', 'Hanno', 'Nino', 'Lenanrt', 'Flo', 'Remi', 'Phillip', 'Hagen', 'Jakob']

const nameToId = new Map(CANONICAL_NAMES.map((n) => [n.toLowerCase(), slugify(n)]))
const idToCanonical = new Map(CANONICAL_NAMES.map((n) => [slugify(n), n]))

function resolvePlayerId(rawName: string): string {
  const key = rawName.trim().toLowerCase()
  const id = nameToId.get(key)
  if (!id) throw new Error(`Unbekannter Spieler in Rohdaten: "${rawName}"`)
  return id
}

interface RawRow {
  Datum: string
  'Team 1': string
  'Team 2': string
  Satzergebnisse: string
  Saison: string
  Team: string
}

function buildMatches(): Match[] {
  const rows = raw as RawRow[]
  return rows.map((row, index) => {
    const [p1a, p1b] = row['Team 1'].split('/').map((s) => resolvePlayerId(s))
    const [p2a, p2b] = row['Team 2'].split('/').map((s) => resolvePlayerId(s))
    const leagueTeam: LeagueTeam = row.Team.trim().endsWith('B') ? 'B' : 'A'
    return {
      id: `seed-${index}-${row.Datum}`,
      date: row.Datum,
      team1: [p1a, p1b],
      team2: [p2a, p2b],
      sets: parseSetsString(row.Satzergebnisse),
      seasonId: slugify(row.Saison),
      leagueTeam,
      createdAt: row.Datum,
    }
  })
}

function buildPlayers(matches: Match[]): Player[] {
  const firstSeen = new Map<string, string>()
  for (const m of [...matches].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const id of [...m.team1, ...m.team2]) {
      if (!firstSeen.has(id)) firstSeen.set(id, m.date)
    }
  }
  return CANONICAL_NAMES.map((name) => {
    const id = slugify(name)
    return {
      id,
      name,
      shortName: name.slice(0, 2).toUpperCase(),
      joinedDate: firstSeen.get(id) ?? matches[0]?.date ?? '2026-01-01',
      active: true,
    }
  })
}

function buildSeasons(matches: Match[]): Season[] {
  const bySeason = new Map<string, { name: string; dates: string[] }>()
  const rows = raw as RawRow[]
  for (const [index, m] of matches.entries()) {
    const seasonName = rows[index].Saison
    const entry = bySeason.get(m.seasonId) ?? { name: seasonName, dates: [] }
    entry.dates.push(m.date)
    bySeason.set(m.seasonId, entry)
  }
  const seasons: Season[] = [...bySeason.entries()].map(([id, { name, dates }]) => {
    const sorted = [...dates].sort()
    return {
      id,
      name,
      startDate: sorted[0],
      endDate: sorted[sorted.length - 1],
      active: false,
    }
  })
  seasons.sort((a, b) => a.startDate.localeCompare(b.startDate))
  // The season holding the most recent match overall is the currently running one.
  const latest = seasons.reduce((acc, s) => (s.endDate! > acc.endDate! ? s : acc), seasons[0])
  latest.active = true
  latest.endDate = null
  return seasons
}

export const seedMatches = buildMatches()
export const seedPlayers = buildPlayers(seedMatches)
export const seedSeasons = buildSeasons(seedMatches)

export function canonicalName(id: string): string {
  return idToCanonical.get(id) ?? id
}
