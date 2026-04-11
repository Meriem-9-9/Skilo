'use client'

import { useState, forwardRef } from 'react'
import { Input, InputProps } from './Input'
import { cn } from '@/lib/utils'

// Icônes SVG inline (pas de dépendance lucide-react requise)
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('w-4 h-4', className)}
      aria-hidden
    >
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('w-4 h-4', className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.118C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.28 2.22zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
        clipRule="evenodd"
      />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  )
}

// Indicateur de force du mot de passe
function getPasswordStrength(password: string): {
  score: number   // 0-4
  label: string
  color: string
} {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const clamped = Math.min(score, 4)
  const labels = ['', 'Faible', 'Moyen', 'Bien', 'Fort']
  const colors = ['', '#DC2626', '#F59E0B', '#6D28D9', '#16A34A']

  return { score: clamped, label: labels[clamped], color: colors[clamped] }
}

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showStrength?: boolean
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, value, onChange, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const [localValue, setLocalValue] = useState('')

    const currentValue = (value as string) ?? localValue
    const strength = showStrength ? getPasswordStrength(currentValue) : null

    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => {
              setLocalValue(e.target.value)
              onChange?.(e)
            }}
            className="pr-11"
            {...props}
          />

          {/* Toggle visibilité */}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'text-[#8B7EA8] hover:text-[#6D28D9]',
              'transition-colors duration-150',
              'focus:outline-none',
              // Si le champ label est présent, on descend légèrement
              props.label && 'mt-[12px]',
            )}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {/* Barre de force */}
        {showStrength && strength && currentValue.length > 0 && (
          <div className="flex flex-col gap-[4px] mt-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      bar <= strength.score ? strength.color : 'rgba(109,40,217,0.1)',
                  }}
                />
              ))}
            </div>
            {strength.label && (
              <p
                className="text-[0.72rem] font-medium"
                style={{ color: strength.color }}
              >
                {strength.label}
              </p>
            )}
          </div>
        )}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
