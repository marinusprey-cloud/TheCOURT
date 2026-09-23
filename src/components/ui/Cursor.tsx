import { motion, useMotionValue, useSpring } from 'framer-motion'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface CursorState {
  label: string | null
  setLabel: (label: string | null) => void
}

const CursorContext = createContext<CursorState | null>(null)

export function useCursorHint(label: string) {
  const ctx = useContext(CursorContext)
  return {
    onMouseEnter: () => ctx?.setLabel(label),
    onMouseLeave: () => ctx?.setLabel(null),
  }
}

export function CursorProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    setEnabled(fine)
  }, [])

  return (
    <CursorContext.Provider value={{ label, setLabel }}>
      <div className={enabled ? 'no-native-cursor' : undefined}>
        {children}
        {enabled && <CustomCursor label={label} />}
      </div>
    </CursorContext.Provider>
  )
}

function CustomCursor({ label }: { label: string | null }) {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 400, damping: 40, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 400, damping: 40, mass: 0.4 })
  const visible = useRef(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible.current) {
        visible.current = true
        setShow(true)
      }
    }
    const leave = () => {
      visible.current = false
      setShow(false)
    }
    window.addEventListener('mousemove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[200] flex items-center justify-center"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full border border-paper/70 bg-ink/40 backdrop-blur-sm"
        animate={{
          width: label ? 84 : 10,
          height: label ? 84 : 10,
          backgroundColor: label ? 'rgba(226,98,44,0.9)' : 'rgba(245,243,239,0.5)',
          borderColor: label ? 'rgba(226,98,44,0.9)' : 'rgba(245,243,239,0.5)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {label && (
          <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-ink">{label}</span>
        )}
      </motion.div>
    </motion.div>
  )
}
