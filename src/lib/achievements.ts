import { computeEloTimeline } from './elo'
import { computePartnerChemistry, computeSeasonStandings, matchesForPlayer } from './stats'
import { summarizeSets } from './sets'
import type { Match, Player, Season } from '../types'

export type AchievementCategory = 'meilenstein' | 'rivalitaet' | 'partner' | 'elo' | 'saison'

export interface AchievementDef {
  id: string
  category: AchievementCategory
  name: string
  description: string
  icon: string
  /** Whether this def can fire more than once per player (e.g. once per season). */
  repeatable?: boolean
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'der-aufstieg', category: 'meilenstein', name: 'Der Aufstieg', description: 'Der erste Sieg überhaupt.', icon: 'Rocket' },
  { id: 'zehnkaempfer', category: 'meilenstein', name: 'Zehnkämpfer', description: '10 Matches gespielt.', icon: 'Medal' },
  { id: 'die-mauer', category: 'meilenstein', name: 'Die Mauer', description: '3 Siege in Folge ohne Satzverlust.', icon: 'ShieldCheck' },
  { id: 'comeback-koenig', category: 'meilenstein', name: 'Comeback-König', description: 'Match gewonnen, nachdem der 1. Satz verloren wurde.', icon: 'ArrowUUpLeft' },
  { id: 'marathonmann', category: 'meilenstein', name: 'Marathonmann', description: 'Das längste 3-Satz-Match der Saison.', icon: 'FlagCheckered', repeatable: true },
  { id: 'angstgegner', category: 'rivalitaet', name: 'Angstgegner', description: 'Ein Gegner, gegen den noch nie gewonnen wurde (min. 3 Duelle).', icon: 'Ghost' },
  { id: 'erloest', category: 'rivalitaet', name: 'Erlöst', description: 'Erster Sieg gegen einen bisherigen Angstgegner.', icon: 'LockOpen' },
  { id: 'dream-team', category: 'partner', name: 'Dream Team', description: 'Die Doppel-Paarung mit der höchsten gemeinsamen Winrate.', icon: 'HandHeart' },
  { id: 'wanderpokal', category: 'partner', name: 'Der Wanderpokal', description: 'Die meisten unterschiedlichen Partner in einer Saison.', icon: 'UsersThree', repeatable: true },
  { id: 'thronbesteigung', category: 'elo', name: 'Thronbesteigung', description: 'Zum ersten Mal Platz 1 der Elo-Liste.', icon: 'Crown' },
  { id: 'der-herausforderer', category: 'elo', name: 'Der Herausforderer', description: 'Größter Elo-Sprung nach einem Sieg gegen einen klar höher gerateten Gegner.', icon: 'Lightning' },
  { id: 'fallschirm', category: 'elo', name: 'Fallschirm', description: 'Größter Elo-Verlust nach einer Niederlage gegen einen klar niedriger gerateten Gegner.', icon: 'ArrowLineDown' },
  { id: 'die-nemesis', category: 'rivalitaet', name: 'Die Nemesis', description: 'Die Paarung mit den meisten gemeinsamen Matches überhaupt.', icon: 'Crosshair' },
]

export const defById = new Map(ACHIEVEMENT_DEFS.map((d) => [d.id, d]))

export interface Unlock {
  defId: string
  playerId: string
  date: string
  matchId?: string
  meta?: Record<string, string | number>
}

export interface Progress {
  defId: string
  playerId: string
  current: number
  target: number
}

export interface SeasonTrophy {
  seasonId: string
  seasonName: string
  championId: string
  finalElo: number
  bestMatch: { matchId: string; date: string; expectedA: number } | null
  biggestSurprise: { matchId: string; date: string; deltaA: number; winnerIds: string[] } | null
}

export interface AchievementsResult {
  unlocks: Unlock[]
  progress: Progress[]
  seasonTrophies: SeasonTrophy[]
}

const MIN_RIVALRY_DUELS = 3
const MIN_PAIR_SAMPLE = 3

export function computeAchievements(players: Player[], matches: Match[], seasons: Season[]): AchievementsResult {
  const unlocks: Unlock[] = []
  const progress: Progress[] = []
  const timeline = computeEloTimeline(players, matches)

  // --- per-player milestone + rivalry achievements ---
  for (const player of players) {
    const records = matchesForPlayer(player.id, matches).sort((a, b) => a.match.date.localeCompare(b.match.date))
    if (records.length === 0) continue

    // Der Aufstieg
    const firstWin = records.find((r) => r.won)
    if (firstWin) {
      unlocks.push({ defId: 'der-aufstieg', playerId: player.id, date: firstWin.match.date, matchId: firstWin.match.id })
    }

    // Zehnkämpfer
    if (records.length >= 10) {
      unlocks.push({ defId: 'zehnkaempfer', playerId: player.id, date: records[9].match.date, matchId: records[9].match.id })
    } else {
      progress.push({ defId: 'zehnkaempfer', playerId: player.id, current: records.length, target: 10 })
    }

    // Die Mauer — 3 straight-set wins in a row (any point in history), plus current trailing run
    let bestRun = 0
    let bestRunEndDate = ''
    let bestRunEndMatch = ''
    let run = 0
    for (const r of records) {
      const { winner, setsA, setsB } = summarizeSets(r.match.sets)
      const ownSetsLost = r.team === 'A' ? setsB : setsA
      const cleanWin = winner === r.team && ownSetsLost === 0
      if (cleanWin) {
        run++
        if (run > bestRun) {
          bestRun = run
          bestRunEndDate = r.match.date
          bestRunEndMatch = r.match.id
        }
      } else {
        run = 0
      }
    }
    if (bestRun >= 3) {
      unlocks.push({ defId: 'die-mauer', playerId: player.id, date: bestRunEndDate, matchId: bestRunEndMatch })
    } else {
      progress.push({ defId: 'die-mauer', playerId: player.id, current: run, target: 3 })
    }

    // Comeback-König — won after losing set 1
    const comeback = records.find((r) => {
      const { winner } = summarizeSets(r.match.sets)
      const firstSet = r.match.sets[0]
      const lostFirstSet = r.team === 'A' ? firstSet.a < firstSet.b : firstSet.b < firstSet.a
      return winner === r.team && lostFirstSet
    })
    if (comeback) {
      unlocks.push({ defId: 'comeback-koenig', playerId: player.id, date: comeback.match.date, matchId: comeback.match.id })
    }

    // Angstgegner / Erlöst — scan chronological results against each opponent
    const lossStreakByOpponent = new Map<string, number>()
    const angstgegnerId = new Map<string, string>() // opponentId currently qualifying, keep the first found
    for (const r of records) {
      for (const oppId of r.opponentIds) {
        const prevStreak = lossStreakByOpponent.get(oppId) ?? 0
        if (r.won) {
          if (prevStreak >= MIN_RIVALRY_DUELS && !unlocks.some((u) => u.defId === 'erloest' && u.playerId === player.id)) {
            unlocks.push({
              defId: 'erloest',
              playerId: player.id,
              date: r.match.date,
              matchId: r.match.id,
              meta: { opponentId: oppId, streak: prevStreak },
            })
          }
          lossStreakByOpponent.set(oppId, 0)
        } else {
          const next = prevStreak + 1
          lossStreakByOpponent.set(oppId, next)
          if (next >= MIN_RIVALRY_DUELS && !angstgegnerId.has(player.id)) {
            angstgegnerId.set(player.id, oppId)
            unlocks.push({
              defId: 'angstgegner',
              playerId: player.id,
              date: r.match.date,
              matchId: r.match.id,
              meta: { opponentId: oppId, streak: next },
            })
          }
        }
      }
    }
    if (!angstgegnerId.has(player.id)) {
      const closest = [...lossStreakByOpponent.entries()].sort((a, b) => b[1] - a[1])[0]
      if (closest) {
        progress.push({ defId: 'angstgegner', playerId: player.id, current: closest[1], target: MIN_RIVALRY_DUELS })
      }
    }

    // Thronbesteigung — first timeline step where this player leads
    const firstLead = timeline.find((step) => step.leaderIdAfter === player.id)
    if (firstLead) {
      unlocks.push({ defId: 'thronbesteigung', playerId: player.id, date: firstLead.match.date, matchId: firstLead.match.id })
    }
  }

  // --- Marathonmann + Der Wanderpokal, per season ---
  for (const season of seasons) {
    const seasonMatches = matches.filter((m) => m.seasonId === season.id)

    const threeSetters = seasonMatches.filter((m) => m.sets.length === 3)
    if (threeSetters.length > 0) {
      const longest = threeSetters.reduce((best, m) => {
        const games = m.sets.reduce((sum, s) => sum + s.a + s.b, 0)
        const bestGames = best.sets.reduce((sum, s) => sum + s.a + s.b, 0)
        return games > bestGames ? m : best
      })
      for (const id of [...longest.team1, ...longest.team2]) {
        unlocks.push({
          defId: 'marathonmann',
          playerId: id,
          date: longest.date,
          matchId: longest.id,
          meta: { seasonId: season.id, seasonName: season.name },
        })
      }
    }

    const partnersBySeasonPlayer = new Map<string, Set<string>>()
    for (const m of seasonMatches) {
      for (const team of [m.team1, m.team2]) {
        for (const id of team) {
          const partnerId = team[0] === id ? team[1] : team[0]
          const set = partnersBySeasonPlayer.get(id) ?? new Set<string>()
          set.add(partnerId)
          partnersBySeasonPlayer.set(id, set)
        }
      }
    }
    let maxPartners = 0
    for (const set of partnersBySeasonPlayer.values()) maxPartners = Math.max(maxPartners, set.size)
    if (maxPartners >= 3) {
      for (const [playerId, set] of partnersBySeasonPlayer) {
        if (set.size === maxPartners) {
          const lastMatch = [...seasonMatches].reverse().find((m) => [...m.team1, ...m.team2].includes(playerId))
          unlocks.push({
            defId: 'wanderpokal',
            playerId,
            date: lastMatch?.date ?? season.startDate,
            matchId: lastMatch?.id,
            meta: { seasonId: season.id, seasonName: season.name, partners: set.size },
          })
        }
      }
    }
  }

  // --- Dream Team (global exhibit, also credited to both players) ---
  const chemistry = computePartnerChemistry(matches).filter((c) => c.played >= MIN_PAIR_SAMPLE)
  if (chemistry.length > 0) {
    const best = chemistry[0]
    const lastMatch = [...matches]
      .filter((m) => (m.team1.includes(best.playerAId) && m.team1.includes(best.playerBId)) || (m.team2.includes(best.playerAId) && m.team2.includes(best.playerBId)))
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    for (const id of [best.playerAId, best.playerBId]) {
      unlocks.push({
        defId: 'dream-team',
        playerId: id,
        date: lastMatch?.date ?? '',
        matchId: lastMatch?.id,
        meta: { partnerId: id === best.playerAId ? best.playerBId : best.playerAId, winRate: Math.round(best.winRate * 100) },
      })
    }
  }

  // --- Die Nemesis (global exhibit): pair with most shared matches, any role ---
  const together = new Map<string, { a: string; b: string; count: number; lastDate: string; lastMatchId: string }>()
  for (const m of matches) {
    const ids = [...m.team1, ...m.team2]
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [x, y] = [ids[i], ids[j]].sort()
        const key = `${x}__${y}`
        const entry = together.get(key) ?? { a: x, b: y, count: 0, lastDate: '', lastMatchId: '' }
        entry.count += 1
        if (m.date >= entry.lastDate) {
          entry.lastDate = m.date
          entry.lastMatchId = m.id
        }
        together.set(key, entry)
      }
    }
  }
  const nemesisEntry = [...together.values()].sort((a, b) => b.count - a.count)[0]
  if (nemesisEntry) {
    for (const id of [nemesisEntry.a, nemesisEntry.b]) {
      unlocks.push({
        defId: 'die-nemesis',
        playerId: id,
        date: nemesisEntry.lastDate,
        matchId: nemesisEntry.lastMatchId,
        meta: { opponentId: id === nemesisEntry.a ? nemesisEntry.b : nemesisEntry.a, matches: nemesisEntry.count },
      })
    }
  }

  // --- Der Herausforderer / Fallschirm (global exhibit: single biggest swing) ---
  if (timeline.length > 0) {
    const biggest = timeline.reduce((best, step) => (Math.abs(step.deltaA) > Math.abs(best.deltaA) ? step : best))
    const winners = biggest.winner === 'A' ? biggest.match.team1 : biggest.match.team2
    const losers = biggest.winner === 'A' ? biggest.match.team2 : biggest.match.team1
    for (const id of winners) {
      unlocks.push({
        defId: 'der-herausforderer',
        playerId: id,
        date: biggest.match.date,
        matchId: biggest.match.id,
        meta: { delta: Math.round(Math.abs(biggest.deltaA)) },
      })
    }
    for (const id of losers) {
      unlocks.push({
        defId: 'fallschirm',
        playerId: id,
        date: biggest.match.date,
        matchId: biggest.match.id,
        meta: { delta: Math.round(Math.abs(biggest.deltaA)) },
      })
    }
  }

  // --- Meisterschale: one permanent record per archived season ---
  const seasonTrophies: SeasonTrophy[] = []
  for (const season of seasons.filter((s) => !s.active)) {
    const eloBefore = timeline.find((s) => s.match.date >= season.startDate)?.eloBefore ?? {}
    const cutoff = season.endDate ?? season.startDate
    const eloAfterSteps = timeline.filter((s) => s.match.date <= cutoff)
    const eloAfter = eloAfterSteps.length > 0 ? eloAfterSteps[eloAfterSteps.length - 1].standingsAfter : {}
    const standings = computeSeasonStandings(players, matches, season, eloBefore, eloAfter)
    if (standings.length === 0) continue
    const champion = standings[0]

    const seasonSteps = timeline.filter((s) => s.match.seasonId === season.id)
    const bestMatchStep = seasonSteps.length
      ? seasonSteps.reduce((best, s) => (Math.abs(s.expectedA - 0.5) < Math.abs(best.expectedA - 0.5) ? s : best))
      : null
    const surpriseStep = seasonSteps.length
      ? seasonSteps.reduce((best, s) => (Math.abs(s.deltaA) > Math.abs(best.deltaA) ? s : best))
      : null

    seasonTrophies.push({
      seasonId: season.id,
      seasonName: season.name,
      championId: champion.playerId,
      finalElo: champion.eloEnd,
      bestMatch: bestMatchStep
        ? { matchId: bestMatchStep.match.id, date: bestMatchStep.match.date, expectedA: bestMatchStep.expectedA }
        : null,
      biggestSurprise: surpriseStep
        ? {
            matchId: surpriseStep.match.id,
            date: surpriseStep.match.date,
            deltaA: surpriseStep.deltaA,
            winnerIds: surpriseStep.winner === 'A' ? surpriseStep.match.team1 : surpriseStep.match.team2,
          }
        : null,
    })
  }

  return { unlocks, progress, seasonTrophies }
}
