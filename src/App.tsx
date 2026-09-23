import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { CursorProvider } from './components/ui/Cursor'
import { ToastProvider } from './components/ui/Toast'
import { MatchModalProvider } from './context/MatchModalContext'
import { SyncStatusProvider } from './context/SyncStatusContext'
import { Arena } from './pages/Arena'
import { HeadToHead } from './pages/HeadToHead'
import { Home } from './pages/Home'
import { League } from './pages/League'
import { Matches } from './pages/Matches'
import { Partners } from './pages/Partners'
import { PlayerProfile } from './pages/PlayerProfile'
import { Players } from './pages/Players'
import { Seasons } from './pages/Seasons'
import { TrophyRoom } from './pages/TrophyRoom'

export default function App() {
  return (
    <SyncStatusProvider>
      <ToastProvider>
        <CursorProvider>
          <MatchModalProvider>
            <div className="grain-overlay" />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="spieler" element={<Players />} />
                <Route path="spieler/:id" element={<PlayerProfile />} />
                <Route path="arena" element={<Arena />} />
                <Route path="matches" element={<Matches />} />
                <Route path="saisons" element={<Seasons />} />
                <Route path="vergleich" element={<HeadToHead />} />
                <Route path="partner" element={<Partners />} />
                <Route path="trophaeen" element={<TrophyRoom />} />
                <Route path="liga" element={<League />} />
              </Route>
            </Routes>
          </MatchModalProvider>
        </CursorProvider>
      </ToastProvider>
    </SyncStatusProvider>
  )
}
