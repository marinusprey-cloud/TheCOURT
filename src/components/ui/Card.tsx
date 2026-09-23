import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-hairline bg-surface/60 backdrop-blur-sm transition-colors duration-300',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
