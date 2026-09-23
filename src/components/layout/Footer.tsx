import clsx from 'clsx'
import { useSyncStatus } from '../../context/SyncStatusContext'

export function Footer() {
  const status = useSyncStatus()

  return (
    <footer className="border-t border-hairline px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-display text-sm text-paper-dim">
          PADEL<span className="text-clay">/</span>LIGA — Rangliste einer festen Gruppe
        </p>
        <div className="flex items-center gap-4">
          <p className="text-xs text-paper-faint">Elo, Winrate &amp; Serien werden live aus jedem Match berechnet.</p>
          <SyncBadge status={status} />
        </div>
      </div>
    </footer>
  )
}

function SyncBadge({ status }: { status: ReturnType<typeof useSyncStatus> }) {
  const label =
    status === 'live'
      ? 'Live synchronisiert'
      : status === 'connecting'
        ? 'Verbinde…'
        : status === 'error'
          ? 'Sync-Fehler — nur lokal'
          : 'Nur lokal gespeichert'

  return (
    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-paper-faint" title={label}>
      <span
        className={clsx(
          'h-1.5 w-1.5 rounded-full',
          status === 'live' && 'bg-court',
          status === 'connecting' && 'animate-pulse bg-clay',
          status === 'error' && 'bg-loss',
          status === 'disabled' && 'bg-paper-faint',
        )}
      />
      {label}
    </span>
  )
}
