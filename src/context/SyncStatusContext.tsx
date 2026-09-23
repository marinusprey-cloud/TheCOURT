import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { startLeagueSync, type SyncStatus } from '../lib/leagueSync'

const SyncStatusContext = createContext<SyncStatus>('disabled')

export function useSyncStatus() {
  return useContext(SyncStatusContext)
}

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('disabled')

  useEffect(() => {
    startLeagueSync(setStatus)
  }, [])

  return <SyncStatusContext.Provider value={status}>{children}</SyncStatusContext.Provider>
}
