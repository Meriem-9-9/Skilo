'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'citron' | 'outline-white' | 'outline-dark' | 'google'
export type ButtonSize = 'sm' | 'md' | 'lg'

// 1. Mise à jour des Props pour inclure asChild
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  asChild?: boolean // <-- CRUCIAL
}

// ── Styles (Gardés tels quels) ──────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#6D28D9] text-[#ffffff] border-transparent hover:bg-[#7C3AED] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(109,40,217,.25)] active:translate-y-0 disabled:opacity-60',
  citron: 'bg-[#D4F000] text-[#1C1033] border-transparent font-bold hover:bg-[#c3e000] hover:border-transparent',
  'outline-white': 'bg-transparent text-[#ffffff] border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.15)] hover:border-transparent',
  'outline-dark': 'bg-[#ffffff] text-[#1C1033] border-[rgba(28,16,51,0.20)] hover:border-[#1C1033] hover:bg-[#f9f9f9]',
  google: 'bg-[#ffffff] text-[#1C1033] border-[rgba(28,16,51,0.20)] font-medium hover:border-[#1C1033] hover:bg-[#f9f9f9]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-6 py-2.5 text-sm rounded-xl',
  md: 'px-5 py-[11px] text-[0.9rem] rounded-xl',
  lg: 'px-7 py-[14px] text-base rounded-xl',
}

// ── Composant principal ───────────────────────────────────────────────────

// Utilisation de forwardRef pour une compatibilité totale
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    asChild = false,
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    ...props
  }, ref) => {

    const Comp = asChild ? Slot : "button"

    // On prépare le contenu sans fragment inutile
    const content = (
      <>
        {loading && <Spinner />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {!loading && children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    )

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center border font-body font-semibold transition-all duration-200',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* SI asChild est vrai, on rend DIRECTEMENT children. 
           C'est le composant enfant (Link) qui recevra les classes.
        */}
        {asChild ? children : content}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button }

// ── Spinner (Gardé tel quel) ───────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}