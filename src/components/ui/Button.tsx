import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Magnetic } from './Magnetic'

interface BaseProps {
  variant?: 'primary' | 'ghost' | 'quiet'
  size?: 'md' | 'sm'
  children: ReactNode
  className?: string
  magnetic?: boolean
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined
  }

type LinkProps = BaseProps & {
  to: string
}

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-sans font-medium tracking-tight transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40'

const variants: Record<NonNullable<BaseProps['variant']>, string> = {
  primary: 'bg-clay text-ink hover:bg-[#f07545] active:bg-clay-dim',
  ghost: 'border border-hairline-strong text-paper hover:border-clay hover:text-clay',
  quiet: 'text-paper-dim hover:text-paper',
}

const sizes: Record<NonNullable<BaseProps['size']>, string> = {
  md: 'px-6 py-3 text-sm',
  sm: 'px-4 py-2 text-xs',
}

function classes(variant: BaseProps['variant'] = 'primary', size: BaseProps['size'] = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], className)
}

export function Button({ variant, size, children, className, magnetic = true, ...rest }: ButtonProps) {
  const content = (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  )
  return magnetic ? <Magnetic className="inline-block">{content}</Magnetic> : content
}

export function LinkButton({ variant, size, children, className, to, magnetic = true }: LinkProps) {
  const content = (
    <Link to={to} className={classes(variant, size, className)}>
      {children}
    </Link>
  )
  return magnetic ? <Magnetic className="inline-block">{content}</Magnetic> : content
}
