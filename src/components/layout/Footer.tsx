export function Footer() {
  return (
    <footer className="border-t border-hairline px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-display text-sm text-paper-dim">
          PADEL<span className="text-clay">/</span>LIGA — Rangliste einer festen Gruppe
        </p>
        <p className="text-xs text-paper-faint">Elo, Winrate & Serien werden live aus jedem Match berechnet.</p>
      </div>
    </footer>
  )
}
