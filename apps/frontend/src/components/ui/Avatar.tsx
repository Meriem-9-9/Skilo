'use client'

import { cn } from '@/lib/utils'

interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'violet' | 'gradient' | 'citron-gradient'
  className?: string
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-[60px] h-[60px] text-lg',
}

const variantMap = {
  violet: 'bg-[#6D28D9] text-[#D4F000]',
  gradient: 'bg-gradient-to-br from-[#6D28D9] to-[#7C3AED] text-white',
  'citron-gradient': 'bg-gradient-to-br from-[#6D28D9] to-[#D4F000] text-white',
}

export function Avatar({
  initials,
  size = 'md',
  variant = 'gradient',
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'font-display font-bold',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      aria-label={`Avatar: ${initials}`}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
