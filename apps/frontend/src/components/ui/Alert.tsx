'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
  visible?: boolean
}

const variantConfig: Record<
  AlertVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  error: {
    bg: 'bg-[rgba(220,38,38,0.06)]',
    border: 'border-[rgba(220,38,38,0.2)]',
    text: 'text-[#DC2626]',
    icon: '⚠',
  },
  success: {
    bg: 'bg-[rgba(22,163,74,0.06)]',
    border: 'border-[rgba(22,163,74,0.25)]',
    text: 'text-[#16A34A]',
    icon: '✓',
  },
  warning: {
    bg: 'bg-[rgba(212,240,0,0.1)]',
    border: 'border-[rgba(212,240,0,0.3)]',
    text: 'text-[#5a6500]',
    icon: '⏱',
  },
  info: {
    bg: 'bg-[rgba(109,40,217,0.06)]',
    border: 'border-[rgba(109,40,217,0.2)]',
    text: 'text-[#6D28D9]',
    icon: 'ℹ',
  },
}

export function Alert({ variant = 'error', children, className, visible = true }: AlertProps) {
  if (!visible) return null

  const cfg = variantConfig[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2',
        'border rounded-lg px-[14px] py-[10px]',
        'text-[0.82rem] text-center',
        cfg.bg,
        cfg.border,
        cfg.text,
        className,
      )}
    >
      <span className="flex-shrink-0 mt-[1px] font-bold">{cfg.icon}</span>
      <span className="leading-snug">{children}</span>
    </div>
  )
}
