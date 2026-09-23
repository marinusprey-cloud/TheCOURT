import { createContext, useContext, useState, type ReactNode } from 'react'
import { MatchForm } from '../components/forms/MatchForm'
import { Modal } from '../components/ui/Modal'

type PrefillTeams = { team1: [string, string]; team2: [string, string] } | undefined

interface MatchModalContextValue {
  openAddMatch: (prefill?: PrefillTeams) => void
}

const MatchModalContext = createContext<MatchModalContextValue | null>(null)

export function useMatchModal() {
  const ctx = useContext(MatchModalContext)
  if (!ctx) throw new Error('useMatchModal must be used within MatchModalProvider')
  return ctx
}

export function MatchModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<PrefillTeams>(undefined)

  return (
    <MatchModalContext.Provider
      value={{
        openAddMatch: (p) => {
          setPrefill(p)
          setOpen(true)
        },
      }}
    >
      {children}
      <Modal open={open} onClose={() => setOpen(false)} title="Neues Match eintragen">
        <MatchForm prefillTeams={prefill} onDone={() => setOpen(false)} />
      </Modal>
    </MatchModalContext.Provider>
  )
}
