import { ArrowDown, TrendUp } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FormDots } from '../components/ui/FormDots'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useCursorHint } from '../components/ui/Cursor'
import { LinkButton } from '../components/ui/Button'
import { Hero3D } from '../components/three/Hero3D'
import { useLeague } from '../hooks/useLeague'
import { formatPercent } from '../lib/format'
import { computePartnerChemistry } from '../lib/stats'

export function Home() {
  const { activeLeaderboard, activeSeason, matches, playerById } = useLeague()
  const reduced = useReducedMotion()
  const leader = activeLeaderboard[0]
  const scrollHint = useCursorHint('Scrollen')

  const seasonMatches = activeSeason ? matches.filter((m) => m.seasonId === activeSeason.id) : []
  const chemistry = computePartnerChemistry(matches).filter((c) => c.played >= 2)
  const bestPair = chemistry[0]
  const hottest = [...activeLeaderboard].sort((a, b) => b.stats.currentStreak.length - a.stats.currentStreak.length)[0]

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-dvh flex-col justify-between overflow-hidden pt-28">
        <Hero3D className="pointer-events-none absolute inset-0 -z-10 opacity-90" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-ink" />

        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-paper-dim"
          >
            Padel Liga {activeSeason && <>· {activeSeason.name}</>}
          </motion.p>

          {leader && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-display mt-4 text-[16vw] font-light leading-[0.88] tracking-tight text-paper sm:text-[13vw] lg:text-[10.5vw]"
              >
                {leader.player.name}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2"
              >
                <span className="font-display tabular text-3xl font-light text-clay sm:text-4xl">
                  {Math.round(leader.elo)} Elo
                </span>
                <span className="text-sm text-paper-dim">
                  aktuell die Nummer 1 · {formatPercent(leader.stats.winRate)} Siegquote · {leader.stats.matchesPlayed} Spiele
                </span>
              </motion.div>
            </>
          )}
        </div>

        <motion.div
          {...scrollHint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mx-auto mb-10 flex flex-col items-center gap-2 text-paper-faint"
        >
          <span className="text-[11px] uppercase tracking-[0.2em]">Scroll to explore</span>
          <motion.span
            animate={reduced ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown size={16} />
          </motion.span>
        </motion.div>
      </section>

      {/* LEADERBOARD */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading
          kicker="Kapitel Eins"
          title="Die aktuelle Rangliste"
          lede="Elo-Punkte aus jedem gespielten Doppel, fortlaufend über alle Saisons hinweg berechnet."
        />

        <div className="mt-14 overflow-hidden rounded-2xl border border-hairline">
          <div className="hidden grid-cols-[3rem_1fr_6rem_6rem_5rem_8rem] gap-4 border-b border-hairline bg-surface/40 px-6 py-3 text-[11px] uppercase tracking-wide text-paper-faint sm:grid">
            <span>#</span>
            <span>Spieler</span>
            <span className="text-right">Elo</span>
            <span className="text-right">Winrate</span>
            <span className="text-right">Spiele</span>
            <span className="text-right">Form</span>
          </div>
          {activeLeaderboard.map((row, i) => (
            <motion.div
              key={row.player.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/spieler/${row.player.id}`}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-hairline px-6 py-4 transition-colors hover:bg-surface/50 sm:grid-cols-[3rem_1fr_6rem_6rem_5rem_8rem]"
              >
                <span className="font-display tabular text-lg text-paper-dim">{String(row.rank).padStart(2, '0')}</span>
                <span className="flex items-center gap-2 font-display text-lg text-paper">
                  {row.player.name}
                  {row.stats.isNew && <Badge tone="clay">Neu</Badge>}
                </span>
                <span className="hidden text-right font-display tabular text-lg text-paper sm:block">
                  {Math.round(row.elo)}
                </span>
                <span className="hidden text-right tabular text-sm text-paper-dim sm:block">
                  {formatPercent(row.stats.winRate)}
                </span>
                <span className="hidden text-right tabular text-sm text-paper-dim sm:block">{row.stats.matchesPlayed}</span>
                <span className="hidden justify-end sm:flex">
                  <FormDots form={row.stats.form} size="sm" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WER SCHLAEGT WEN */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading
          kicker="Kapitel Zwei"
          title="Wer schlägt wen"
          lede="Manche Paarungen harmonieren einfach — und manche Gegner liegen einem besonders gut."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {bestPair && (
            <Card className="p-8">
              <p className="mb-3 text-xs uppercase tracking-wide text-paper-faint">Beste Doppel-Chemie</p>
              <p className="font-display text-3xl font-light text-paper">
                {playerById.get(bestPair.playerAId)?.name} <span className="text-paper-faint">&amp;</span>{' '}
                {playerById.get(bestPair.playerBId)?.name}
              </p>
              <p className="mt-3 tabular text-clay">
                {formatPercent(bestPair.winRate)} Siegquote <span className="text-paper-faint">· {bestPair.played} Spiele zusammen</span>
              </p>
              <Link to="/partner" className="mt-6 inline-block text-xs uppercase tracking-wide text-paper-dim hover:text-clay">
                Alle Paarungen ansehen →
              </Link>
            </Card>
          )}
          {hottest && hottest.stats.currentStreak.length > 1 && (
            <Card className="p-8">
              <p className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-paper-faint">
                <TrendUp size={14} /> Heißeste Serie
              </p>
              <p className="font-display text-3xl font-light text-paper">{hottest.player.name}</p>
              <p className="mt-3 tabular text-court">
                {hottest.stats.currentStreak.length}×{' '}
                {hottest.stats.currentStreak.type === 'win' ? 'in Folge gewonnen' : 'in Folge verloren'}
              </p>
              <Link to={`/spieler/${hottest.player.id}`} className="mt-6 inline-block text-xs uppercase tracking-wide text-paper-dim hover:text-clay">
                Profil ansehen →
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* SAISON BISHER */}
      {activeSeason && (
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <SectionHeading
            kicker="Kapitel Drei"
            title="Die Saison bisher"
            lede={`${activeSeason.name} läuft seit ${new Date(activeSeason.startDate).toLocaleDateString('de-DE')} — ${seasonMatches.length} Matches bisher gespielt.`}
          />
          <div className="mt-14">
            <LinkButton to="/saisons">Saison-Rückblick öffnen</LinkButton>
          </div>
        </section>
      )}
    </div>
  )
}
