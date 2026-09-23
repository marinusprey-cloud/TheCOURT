import { List, Plus, X } from '@phosphor-icons/react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useMatchModal } from '../../context/MatchModalContext'
import { useCursorHint } from '../ui/Cursor'
import { Magnetic } from '../ui/Magnetic'

const LINKS = [
  { to: '/', label: 'Rangliste' },
  { to: '/spieler', label: 'Spieler' },
  { to: '/arena', label: 'Arena' },
  { to: '/matches', label: 'Matches' },
  { to: '/saisons', label: 'Saisons' },
  { to: '/vergleich', label: 'Vergleich' },
  { to: '/partner', label: 'Partner' },
  { to: '/trophaeen', label: 'Trophäen' },
  { to: '/liga', label: 'Liga' },
]

export function Nav() {
  const { scrollY } = useScroll()
  const bg = useTransform(scrollY, [0, 120], ['rgba(10,10,10,0)', 'rgba(10,10,10,0.82)'])
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 1])
  const { openAddMatch } = useMatchModal()
  const [mobileOpen, setMobileOpen] = useState(false)
  const plusHint = useCursorHint('Öffnen')

  return (
    <motion.header
      style={{ backgroundColor: bg }}
      className="fixed inset-x-0 top-0 z-[120] backdrop-blur-md"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline-strong"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <NavLink to="/" className="font-display text-lg font-medium tracking-tight text-paper" {...plusHint}>
          PADEL<span className="text-clay">/</span>LIGA
        </NavLink>

        <nav className="hidden items-center gap-5 xl:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'font-sans text-[13px] font-medium uppercase tracking-wide transition-colors',
                  isActive ? 'text-clay' : 'text-paper-dim hover:text-paper',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Magnetic className="hidden sm:inline-block">
            <button
              onClick={() => openAddMatch()}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-clay px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink transition-colors hover:bg-[#f07545]"
            >
              <Plus size={14} weight="bold" /> Match
            </button>
          </Magnetic>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            className="cursor-pointer rounded-full p-2 text-paper xl:hidden"
          >
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex max-h-[calc(100dvh-4.5rem)] flex-col gap-1 overflow-y-auto border-t border-hairline bg-ink px-5 pb-5 pt-3 xl:hidden"
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-3 font-sans text-sm font-medium uppercase tracking-wide',
                  isActive ? 'bg-clay/10 text-clay' : 'text-paper-dim',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false)
              openAddMatch()
            }}
            className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-clay px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink"
          >
            <Plus size={14} weight="bold" /> Match eintragen
          </button>
        </motion.nav>
      )}
    </motion.header>
  )
}
