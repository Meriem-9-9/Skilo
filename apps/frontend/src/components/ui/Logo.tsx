// 'use client'

// import Link from 'next/link'
// import { cn } from '@/lib/utils'

// interface LogoProps {
//   /** 'dark' = fond sombre → texte blanc + citron  |  'light' = fond clair → dark + violet */
//   variant?: 'dark' | 'light'
//   size?: 'sm' | 'md' | 'lg'
//   href?: string
//   className?: string
// }

// const sizeMap = {
//   sm: 'text-lg',
//   md: 'text-xl',
//   lg: 'text-2xl',
// }

// export default function Logo({
//   variant = 'dark',
//   size = 'md',
//   href = '/',
//   className,
// }: LogoProps) {
//   const content = (
//     <span
//       className={cn(
//         'font-display font-extrabold tracking-tight select-none',
//         sizeMap[size],
//         className,
//       )}
//     >
//       <span className={variant === 'dark' ? 'text-white' : 'text-[#1C1033]'}>
//         Skill
//       </span>
//       <span className={variant === 'dark' ? 'text-[#D4F000]' : 'text-[#6D28D9]'}>
//         Swap
//       </span>
//     </span>
//   )

//   if (!href) return content

//   return (
//     <Link href={href} className="inline-flex items-center textDecoration: 'none'">
//       {content}
//     </Link>
//   )
// }

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizeMap: Record<string, string> = {
  sm: '1.25rem',
  md: '1.6rem',
  lg: '2rem',
}

export default function Logo({
  variant = 'dark',
  size = 'md',
  href = '/',
  className,
}: LogoProps) {
  const content = (
    <span
      className={cn('select-none', className)}
      style={{
        fontWeight: 800,
        fontSize: sizeMap[size],
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textDecoration: 'none',
      }}
    >
      <span style={{ color: variant === 'dark' ? '#ffffff' : '#1C1033' }}>
        Ski
      </span>
      <span style={{ color: variant === 'dark' ? '#D4F000' : '#6D28D9' }}>
        lo
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
    >
      {content}
    </Link>
  )
}