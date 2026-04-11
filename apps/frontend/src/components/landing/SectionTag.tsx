import { ReactNode } from 'react'

interface SectionTagProps {
  children: ReactNode
}

/**
 * Petit badge de catégorie utilisé en haut de chaque section.
 * Ex: "Simple & rapide", "Pourquoi SkillSwap", etc.
 */
export function SectionTag({ children }: SectionTagProps) {
  return (
    <span style={{ marginBottom: '24px' }} className="inline-block bg-[rgba(109,40,217,0.10)] text-[#6D28D9] text-[0.78rem] font-bold tracking-[0.10em] uppercase px-[14px] py-[5px] rounded-full mb-4 border border-[rgba(109,40,217,0.15)]">
      {children}
    </span>
  )
}
