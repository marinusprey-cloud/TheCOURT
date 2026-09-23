import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedMatches, seedPlayers, seedSeasons } from '../data/seed'
import { slugify, today } from '../lib/format'
import { validateSets } from '../lib/sets'
import type { LeagueTeam, Match, Player, Season, SetScore } from '../types'

export interface NewMatchInput {
  date: string
  team1: [string, string]
  team2: [string, string]
  sets: SetScore[]
  seasonId?: string
  leagueTeam?: LeagueTeam
}

export interface ArenaSuggestionRecord {
  id: string
  createdAt: string
  team1: [string, string]
  team2: [string, string]
  expectedA: number
  resultMatchId: string | null
}

export interface LeagueState {
  players: Player[]
  matches: Match[]
  seasons: Season[]
  arenaSuggestions: ArenaSuggestionRecord[]
  addMatch: (input: NewMatchInput) => { ok: true; id: string } | { ok: false; error: string }
  updateMatch: (id: string, input: NewMatchInput) => { ok: true } | { ok: false; error: string }
  deleteMatch: (id: string) => void
  addPlayer: (name: string, joinedDate?: string) => { ok: true; id: string } | { ok: false; error: string }
  setPlayerActive: (id: string, active: boolean) => void
  startSeason: (name: string) => { ok: true; id: string } | { ok: false; error: string }
  endSeason: (id: string) => void
  activeSeason: () => Season | undefined
  logArenaSuggestion: (team1: [string, string], team2: [string, string], expectedA: number) => string
}

function validatePlayers(team1: [string, string], team2: [string, string]): string | null {
  const all = [...team1, ...team2]
  if (new Set(all).size !== 4) return 'Jeder Spieler kann nur einmal im Match antreten.'
  return null
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

function pairingKey(team1: [string, string], team2: [string, string]): string {
  return [pairKey(...team1), pairKey(...team2)].sort().join('__')
}

export const useLeagueStore = create<LeagueState>()(
  persist(
    (set, get) => ({
      players: seedPlayers,
      matches: seedMatches,
      seasons: seedSeasons,
      arenaSuggestions: [],

      activeSeason: () => get().seasons.find((s) => s.active),

      addMatch: (input) => {
        const playerError = validatePlayers(input.team1, input.team2)
        if (playerError) return { ok: false, error: playerError }
        const setsValidation = validateSets(input.sets)
        if (!setsValidation.valid) return { ok: false, error: setsValidation.error! }
        const season = input.seasonId
          ? get().seasons.find((s) => s.id === input.seasonId)
          : get().activeSeason()
        if (!season) return { ok: false, error: 'Keine aktive Saison gefunden. Bitte zuerst eine Saison starten.' }

        const id = crypto.randomUUID()
        const match: Match = {
          id,
          date: input.date,
          team1: input.team1,
          team2: input.team2,
          sets: input.sets,
          seasonId: season.id,
          leagueTeam: input.leagueTeam ?? 'A',
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const key = pairingKey(match.team1, match.team2)
          const candidate = [...state.arenaSuggestions]
            .reverse()
            .find((s) => s.resultMatchId === null && pairingKey(s.team1, s.team2) === key)
          return {
            matches: [match, ...state.matches],
            arenaSuggestions: candidate
              ? state.arenaSuggestions.map((s) => (s.id === candidate.id ? { ...s, resultMatchId: id } : s))
              : state.arenaSuggestions,
          }
        })
        return { ok: true, id }
      },

      logArenaSuggestion: (team1, team2, expectedA) => {
        const id = crypto.randomUUID()
        set((state) => ({
          arenaSuggestions: [
            { id, createdAt: new Date().toISOString(), team1, team2, expectedA, resultMatchId: null },
            ...state.arenaSuggestions,
          ].slice(0, 30),
        }))
        return id
      },

      updateMatch: (id, input) => {
        const playerError = validatePlayers(input.team1, input.team2)
        if (playerError) return { ok: false, error: playerError }
        const setsValidation = validateSets(input.sets)
        if (!setsValidation.valid) return { ok: false, error: setsValidation.error! }
        const existing = get().matches.find((m) => m.id === id)
        if (!existing) return { ok: false, error: 'Match nicht gefunden.' }
        const seasonId = input.seasonId ?? existing.seasonId
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === id
              ? {
                  ...m,
                  date: input.date,
                  team1: input.team1,
                  team2: input.team2,
                  sets: input.sets,
                  seasonId,
                  leagueTeam: input.leagueTeam ?? m.leagueTeam,
                }
              : m,
          ),
        }))
        return { ok: true }
      },

      deleteMatch: (id) => set((state) => ({ matches: state.matches.filter((m) => m.id !== id) })),

      addPlayer: (name, joinedDate) => {
        const trimmed = name.trim()
        if (!trimmed) return { ok: false, error: 'Name darf nicht leer sein.' }
        const id = slugify(trimmed)
        if (get().players.some((p) => p.id === id)) {
          return { ok: false, error: 'Ein Spieler mit diesem Namen existiert bereits.' }
        }
        const player: Player = {
          id,
          name: trimmed,
          shortName: trimmed.slice(0, 2).toUpperCase(),
          joinedDate: joinedDate ?? today(),
          active: true,
        }
        set((state) => ({ players: [...state.players, player] }))
        return { ok: true, id }
      },

      setPlayerActive: (id, active) =>
        set((state) => ({ players: state.players.map((p) => (p.id === id ? { ...p, active } : p)) })),

      startSeason: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return { ok: false, error: 'Saisonname darf nicht leer sein.' }
        const id = slugify(trimmed)
        if (get().seasons.some((s) => s.id === id)) {
          return { ok: false, error: 'Eine Saison mit diesem Namen existiert bereits.' }
        }
        const t = today()
        set((state) => ({
          seasons: [
            ...state.seasons.map((s) => (s.active ? { ...s, active: false, endDate: s.endDate ?? t } : s)),
            { id, name: trimmed, startDate: t, endDate: null, active: true },
          ],
        }))
        return { ok: true, id }
      },

      endSeason: (id) =>
        set((state) => ({
          seasons: state.seasons.map((s) => (s.id === id ? { ...s, active: false, endDate: s.endDate ?? today() } : s)),
        })),
    }),
    {
      name: 'padel-liga-store',
      version: 1,
    },
  ),
)
