'use client'

import { cn } from '@/lib/utils'

export type SkillTagVariant = 'offered' | 'wanted' | 'neutral'

interface SkillTagProps {
  children: string
  variant?: SkillTagVariant
  className?: string
}

const variantStyles: Record<SkillTagVariant, string> = {
  offered: 'bg-[rgba(109,40,217,0.1)] text-[#6D28D9]',
  wanted: 'bg-[rgba(212,240,0,0.25)] text-[#5a6500]',
  neutral: 'bg-[rgba(109,40,217,0.05)] text-[#8B7EA8] border border-[rgba(109,40,217,0.15)]',
}

export function SkillTag({ children, variant = 'neutral', className }: SkillTagProps) {
  return (
    <span
      className={cn(
        'inline-block px-[10px] py-[4px] rounded-md',
        'text-[0.75rem] font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
