'use client'

import { cn } from '@/lib/utils'

interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label = 'ou continuer avec', className }: DividerProps) {
  return (
    <div className={cn('flex items-center gap-3 my-5', className)}>
      <div className="flex-1 h-px bg-[rgba(109,40,217,0.1)]" />
      {label && (
        <span className="text-[0.78rem] text-[#8B7EA8] font-medium whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-[rgba(109,40,217,0.1)]" />
    </div>
  )
}
