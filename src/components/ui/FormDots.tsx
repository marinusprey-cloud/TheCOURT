import clsx from 'clsx'

export function FormDots({ form, size = 'md' }: { form: ('win' | 'loss')[]; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
  if (!form.length) {
    return <span className="text-xs text-paper-faint">—</span>
  }
  return (
    <div className="flex items-center gap-1.5" aria-label={`Form der letzten ${form.length} Spiele`}>
      {form.map((r, i) => (
        <span
          key={i}
          title={r === 'win' ? 'Sieg' : 'Niederlage'}
          className={clsx(
            dim,
            'rounded-full',
            r === 'win' ? 'bg-court' : 'bg-loss',
          )}
        />
      ))}
    </div>
  )
}
