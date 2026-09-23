export interface Player {
  id: string
  name: string
  shortName: string
  joinedDate: string
  active: boolean
}

export interface SetScore {
  a: number
  b: number
}

export type LeagueTeam = 'A' | 'B'

export interface Match {
  id: string
  date: string // ISO yyyy-mm-dd
  team1: [string, string] // player ids
  team2: [string, string] // player ids
  sets: SetScore[]
  seasonId: string
  leagueTeam: LeagueTeam
  createdAt: string
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate: string | null
  active: boolean
}

export interface EloPoint {
  date: string
  matchId: string | null
  elo: number
}

export interface PlayerDerived {
  player: Player
  elo: number
  eloHistory: EloPoint[]
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number
  currentStreak: { type: 'win' | 'loss' | 'none'; length: number }
  avgSetsPerMatch: number
  clutchFactor: { winRate: number; played: number }
  isNew: boolean
  bestPartner: { partnerId: string; winRate: number; played: number } | null
  toughestOpponent: { opponentId: string; winRate: number; played: number } | null
  easiestOpponent: { opponentId: string; winRate: number; played: number } | null
}
