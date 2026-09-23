import {
  ArrowLineDown,
  ArrowUUpLeft,
  Crosshair,
  Crown,
  FlagCheckered,
  Ghost,
  HandHeart,
  Lightning,
  LockOpen,
  Medal,
  Rocket,
  ShieldCheck,
  Trophy,
  UsersThree,
  type IconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

const ICONS: Record<string, ComponentType<IconProps>> = {
  Rocket,
  Medal,
  ShieldCheck,
  ArrowUUpLeft,
  FlagCheckered,
  Ghost,
  LockOpen,
  HandHeart,
  UsersThree,
  Crown,
  Lightning,
  ArrowLineDown,
  Crosshair,
  Trophy,
}

export function TrophyIcon({ name, ...props }: { name: string } & IconProps) {
  const Icon = ICONS[name] ?? Trophy
  return <Icon {...props} />
}
