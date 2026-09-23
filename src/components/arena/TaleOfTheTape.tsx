import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { MatchupSuggestion } from '../../lib/matchmaking'
import { expectedScore, fairnessLabel, pairFacts, teamElo } from '../../lib/matchmaking'
import { formatPercent } from '../../lib/format'
import type { Match, Player } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface TapeProps {
  suggestion: MatchupSuggestion
  eloMap: Record<string, number>
  playerById: Map<string, Player>
  matches: Match[]
  onStartMatch: (team1: [string, string], team2: [string, string], expectedA: number) => void
}

type SlotKey = 'a0' | 'a1' | 'b0' | 'b1'
const SLOT_ORDER: SlotKey[] = ['a0', 'a1', 'b0', 'b1']

export function TaleOfTheTape({ suggestion, eloMap, playerById, matches, onStartMatch }: TapeProps) {
  const [slots, setSlots] = useState<Record<SlotKey, string>>({
    a0: suggestion.team1[0],
    a1: suggestion.team1[1],
    b0: suggestion.team2[0],
    b1: suggestion.team2[1],
  })
  const [previewSwap, setPreviewSwap] = useState<[SlotKey, SlotKey] | null>(null)
  const slotRefs = useRef<Partial<Record<SlotKey, HTMLDivElement | null>>>({})
  const [dragging, setDragging] = useState<SlotKey | null>(null)

  const effectiveSlots = useMemo(() => {
    if (!previewSwap) return slots
    const [x, y] = previewSwap
    return { ...slots, [x]: slots[y], [y]: slots[x] }
  }, [slots, previewSwap])

  const team1: [string, string] = [effectiveSlots.a0, effectiveSlots.a1]
  const team2: [string, string] = [effectiveSlots.b0, effectiveSlots.b1]
  const expectedA = expectedScore(teamElo(eloMap, team1), teamElo(eloMap, team2))
  const label = fairnessLabel(expectedA)
  const facts1 = useMemo(() => pairFacts(team1[0], team1[1], matches), [team1, matches])
  const facts2 = useMemo(() => pairFacts(team2[0], team2[1], matches), [team2, matches])

  const findSlotAt = (x: number, y: number): SlotKey | null => {
    for (const key of SLOT_ORDER) {
      const el = slotRefs.current[key]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return key
    }
    return null
  }

  const handleDrag = (source: SlotKey, x: number, y: number) => {
    const target = findSlotAt(x, y)
    if (target && target !== source) setPreviewSwap([source, target])
    else setPreviewSwap(null)
  }

  const handleDragEnd = (source: SlotKey, x: number, y: number) => {
    const target = findSlotAt(x, y)
    setDragging(null)
    setPreviewSwap(null)
    if (target && target !== source) {
      setSlots((prev) => ({ ...prev, [source]: prev[target], [target]: prev[source] }))
    }
  }

  const name = (id: string) => playerById.get(id)?.name ?? id

  return (
    <div className="relative overflow-hidden rounded-3xl border border-hairline-strong bg-surface-2">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
        style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(79,157,116,0.16), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{ background: 'radial-gradient(ellipse at 80% 30%, rgba(226,98,44,0.16), transparent 65%)' }}
      />

      <div className="relative flex items-center justify-center gap-2 border-b border-hairline px-6 pt-6">
        <Badge tone={label === 'Sehr ausgeglichen' ? 'court' : label === 'Klarer Favorit' ? 'loss' : 'clay'}>
          {label}
        </Badge>
        {suggestion.bench.length > 0 && (
          <span className="text-[11px] text-paper-faint">
            Pause: {suggestion.bench.map((id) => name(id)).join(', ')}
          </span>
        )}
      </div>

      <div className="relative grid grid-cols-2 gap-4 px-4 pb-2 pt-8 sm:px-10">
        <TeamColumn
          slots={['a0', 'a1']}
          effectiveSlots={effectiveSlots}
          eloMap={eloMap}
          name={name}
          slotRefs={slotRefs}
          dragging={dragging}
          setDragging={setDragging}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          align="right"
        />
        <TeamColumn
          slots={['b0', 'b1']}
          effectiveSlots={effectiveSlots}
          eloMap={eloMap}
          name={name}
          slotRefs={slotRefs}
          dragging={dragging}
          setDragging={setDragging}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          align="left"
        />
      </div>

      <div className="relative px-6 pb-2 pt-6 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="font-display tabular w-16 shrink-0 text-right text-2xl font-light text-court sm:text-3xl">
            {formatPercent(expectedA, 0)}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full bg-gradient-to-r from-court to-clay"
              animate={{ width: `${expectedA * 100}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            />
          </div>
          <span className="font-display tabular w-16 shrink-0 text-left text-2xl font-light text-clay sm:text-3xl">
            {formatPercent(1 - expectedA, 0)}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 px-4 pb-6 pt-2 text-center sm:px-10">
        <FactLine facts={facts1} />
        <FactLine facts={facts2} />
      </div>

      <div className="relative flex justify-center border-t border-hairline px-6 py-5">
        <Button size="md" onClick={() => onStartMatch(team1, team2, expectedA)}>
          Match starten
        </Button>
      </div>
    </div>
  )
}

function FactLine({ facts }: { facts: ReturnType<typeof pairFacts> }) {
  if (facts.played === 0) return <p className="text-xs text-paper-faint">Noch nie zusammen gespielt.</p>
  if (facts.unbeaten) return <p className="text-xs text-court">Bisher unbesiegt als Duo ({facts.played} Spiele).</p>
  if (facts.winStreak >= 2) return <p className="text-xs text-court">{facts.winStreak} gemeinsame Siege in Folge.</p>
  if (facts.loseStreak >= 2) return <p className="text-xs text-loss">{facts.loseStreak} gemeinsame Niederlagen in Folge.</p>
  return <p className="text-xs text-paper-faint">{facts.played} gemeinsame Spiele bisher.</p>
}

interface TeamColumnProps {
  slots: [SlotKey, SlotKey]
  effectiveSlots: Record<SlotKey, string>
  eloMap: Record<string, number>
  name: (id: string) => string
  slotRefs: MutableRefObject<Partial<Record<SlotKey, HTMLDivElement | null>>>
  dragging: SlotKey | null
  setDragging: (s: SlotKey | null) => void
  onDrag: (source: SlotKey, x: number, y: number) => void
  onDragEnd: (source: SlotKey, x: number, y: number) => void
  align: 'left' | 'right'
}

function TeamColumn({ slots, effectiveSlots, eloMap, name, slotRefs, dragging, setDragging, onDrag, onDragEnd, align }: TeamColumnProps) {
  return (
    <div className={`flex flex-col gap-3 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      {slots.map((slot) => (
        <PlayerSlot
          key={slot}
          slot={slot}
          playerId={effectiveSlots[slot]}
          name={name(effectiveSlots[slot])}
          elo={eloMap[effectiveSlots[slot]] ?? 1000}
          setRef={(el) => (slotRefs.current[slot] = el)}
          isDragging={dragging === slot}
          onDragStart={() => setDragging(slot)}
          onDrag={(x, y) => onDrag(slot, x, y)}
          onDragEnd={(x, y) => onDragEnd(slot, x, y)}
        />
      ))}
    </div>
  )
}

interface SlotProps {
  slot: SlotKey
  playerId: string
  name: string
  elo: number
  setRef: (el: HTMLDivElement | null) => void
  isDragging: boolean
  onDragStart: () => void
  onDrag: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
}

function PlayerSlot({ playerId, name, elo, setRef, isDragging, onDragStart, onDrag, onDragEnd }: SlotProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 500, damping: 32 })
  const springY = useSpring(y, { stiffness: 500, damping: 32 })

  return (
    <div ref={setRef} className="relative">
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.15}
        onDragStart={onDragStart}
        onDrag={(_, info) => {
          x.set(info.offset.x)
          y.set(info.offset.y)
          onDrag(info.point.x, info.point.y)
        }}
        onDragEnd={(_, info) => {
          x.set(0)
          y.set(0)
          onDragEnd(info.point.x, info.point.y)
        }}
        style={{ x: springX, y: springY }}
        whileDrag={{ scale: 1.06, zIndex: 20 }}
        className={`min-w-[9.5rem] cursor-grab select-none rounded-2xl border px-4 py-3 shadow-lg active:cursor-grabbing ${
          isDragging ? 'border-clay bg-surface-3' : 'border-hairline-strong bg-surface-3/80'
        }`}
        key={playerId}
      >
        <p className="font-display text-lg text-paper">{name}</p>
        <p className="tabular text-xs text-paper-dim">{Math.round(elo)} Elo</p>
      </motion.div>
    </div>
  )
}
