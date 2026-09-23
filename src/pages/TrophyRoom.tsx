import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { TrophyCard } from '../components/achievements/TrophyCard'
import { TrophyIcon } from '../components/achievements/TrophyIcon'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { ACHIEVEMENT_DEFS, computeAchievements, type AchievementCategory } from '../lib/achievements'
import { formatDate, formatPercent } from '../lib/format'

const CATEGORY_ORDER: { key: AchievementCategory; kicker: string; title: string }[] = [
  { key: 'meilenstein', kicker: 'Kapitel Eins', title: 'Meilensteine' },
  { key: 'rivalitaet', kicker: 'Kapitel Zwei', title: 'Rivalitäten' },
  { key: 'partner', kicker: 'Kapitel Drei', title: 'Partnerschaften' },
  { key: 'elo', kicker: 'Kapitel Vier', title: 'Elo-Legenden' },
]

export function TrophyRoom() {
  const { players, matches, seasons, playerById } = useLeague()

  const { unlocks, progress, seasonTrophies } = useMemo(
    () => computeAchievements(players, matches, seasons),
    [players, matches, seasons],
  )

  const unlocksByDef = useMemo(() => {
    const map = new Map<string, typeof unlocks>()
    for (const u of unlocks) {
      const list = map.get(u.defId) ?? []
      list.push(u)
      map.set(u.defId, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date))
    return map
  }, [unlocks])

  const bestProgressByDef = useMemo(() => {
    const map = new Map<string, (typeof progress)[number]>()
    for (const p of progress) {
      const existing = map.get(p.defId)
      if (!existing || p.current > existing.current) map.set(p.defId, p)
    }
    return map
  }, [progress])

  return (
    <div>
      <section className="relative flex min-h-[70dvh] flex-col items-center justify-center overflow-hidden px-5 text-center sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(226,98,44,0.14), transparent 60%)' }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-xs uppercase tracking-[0.25em] text-paper-faint"
        >
          Die Trophäenkammer
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-display mt-5 max-w-3xl text-5xl font-light leading-[1.05] tracking-tight text-paper sm:text-7xl"
        >
          {unlocks.length} Trophäen
          <br />
          <span className="text-paper-dim">im Schrank der Liga</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-xs uppercase tracking-[0.2em] text-paper-faint"
        >
          Scroll to explore
        </motion.p>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-32 sm:px-8">
        {CATEGORY_ORDER.map((cat) => {
          const defs = ACHIEVEMENT_DEFS.filter((d) => d.category === cat.key)
          return (
            <section key={cat.key} className="py-16">
              <SectionHeading kicker={cat.kicker} title={cat.title} />
              <div className="mt-12">
                {defs.map((def) => (
                  <TrophyCard
                    key={def.id}
                    def={def}
                    laureates={unlocksByDef.get(def.id) ?? []}
                    bestProgress={bestProgressByDef.get(def.id) ?? null}
                    playerById={playerById}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {seasonTrophies.length > 0 && (
          <section className="py-16">
            <SectionHeading kicker="Kapitel Fünf" title="Die Meisterschale" lede="Ein permanenter Eintrag für jede abgeschlossene Saison." />
            <div className="mt-12 space-y-6">
              {seasonTrophies.map((t) => (
                <Card key={t.seasonId} className="p-6 sm:p-8">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-clay/50 bg-clay/10">
                      <TrophyIcon name="Crown" size={26} weight="fill" className="text-clay" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-paper-faint">{t.seasonName}</p>
                      <p className="font-display mt-1 text-2xl font-light text-paper">
                        {playerById.get(t.championId)?.name}
                      </p>
                      <p className="tabular mt-1 text-sm text-clay">{Math.round(t.finalElo)} Elo zum Saisonende</p>
                      <div className="mt-4 space-y-1 text-xs text-paper-dim">
                        {t.bestMatch && (
                          <p>
                            Bestes Match: {formatDate(t.bestMatch.date)} ({formatPercent(t.bestMatch.expectedA, 0)}:
                            {formatPercent(1 - t.bestMatch.expectedA, 0)} erwartet)
                          </p>
                        )}
                        {t.biggestSurprise && (
                          <p>
                            Größte Überraschung: {formatDate(t.biggestSurprise.date)} —{' '}
                            {t.biggestSurprise.winnerIds.map((id) => playerById.get(id)?.name).join(' & ')} gewinnen
                            als Außenseiter (+{Math.round(Math.abs(t.biggestSurprise.deltaA))} Elo)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
