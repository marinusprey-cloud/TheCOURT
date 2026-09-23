import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EloChart } from '../components/charts/EloChart'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { FormDots } from '../components/ui/FormDots'
import { Magnetic } from '../components/ui/Magnetic'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLeague } from '../hooks/useLeague'
import { formatPercent } from '../lib/format'

export function Players() {
  const { activeLeaderboard, elo } = useLeague()
  const active = activeLeaderboard

  return (
    <div className="mx-auto max-w-7xl px-5 pb-32 pt-36 sm:px-8">
      <SectionHeading
        kicker="Kader"
        title="Spieler-Profile"
        lede="Elo-Verlauf, Bilanz und bevorzugte Partner für jede Spielerin und jeden Spieler der Liga."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((row, i) => (
          <motion.div
            key={row.player.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.5, delay: (i % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <Magnetic strength={0.08}>
              <Link to={`/spieler/${row.player.id}`}>
                <Card className="group p-6 hover:border-clay/50">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="font-display text-2xl font-light text-paper">{row.player.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-paper-faint">Rang {row.rank}</p>
                    </div>
                    {row.stats.isNew && <Badge tone="clay">Neu</Badge>}
                  </div>

                  <EloChart
                    points={elo.history[row.player.id] ?? []}
                    height={48}
                    gradientId={`grad-players-${row.player.id}`}
                  />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display tabular text-xl text-clay">{Math.round(row.elo)}</span>
                    <span className="tabular text-xs text-paper-dim">{formatPercent(row.stats.winRate)} Winrate</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-paper-faint">{row.stats.matchesPlayed} Spiele</span>
                    <FormDots form={row.stats.form} size="sm" />
                  </div>
                </Card>
              </Link>
            </Magnetic>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
