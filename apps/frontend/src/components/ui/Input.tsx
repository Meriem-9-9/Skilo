'use client'

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  rightSlot?: ReactNode  // ex: lien "Mot de passe oublié ?"
  leftIcon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, rightSlot, leftIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-[6px]">
        {/* Label + slot droit (ex: lien oublié) */}
        {(label || rightSlot) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-[0.8rem] font-semibold text-[#1C1033] tracking-[0.01em]"
              >
                {label}
              </label>
            )}
            {rightSlot && <div className="text-[0.78rem]">{rightSlot}</div>}
          </div>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7EA8] flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              'w-full bg-white text-[#1C1033] font-body',
              'border rounded-lg px-[14px] py-[11px] text-[0.9rem]',
              'placeholder:text-[#8B7EA8]/50',
              'outline-none transition-all duration-200',
              // Bordure normale
              'border-[rgba(124,58,237,0.2)]',
              // Focus
              'focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.1)]',
              // Erreur
              error && 'border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.08)] focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]',
              // Padding gauche si icône
              leftIcon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="text-[0.75rem] text-[#DC2626] leading-tight">{error}</p>
        )}

        {/* Hint (optionnel) */}
        {hint && !error && (
          <p className="text-[0.75rem] text-[#8B7EA8] leading-tight">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
