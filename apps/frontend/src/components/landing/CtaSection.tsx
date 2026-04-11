import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function CtaSection() {
  return (
    <section className="bg-[#1C1033] px-[5%] py-[80px] text-center">

      <h2 style={{ textShadow: '0 4px 14px rgba(255, 255, 255, 0.3)' ,marginBottom: '1rem' }} 
      className="font-display text-[clamp(2rem,4vw,2.8rem)] font-extrabold text-[#ffffff] tracking-tight mb-4">
        Prêt à échanger vos compétences ?
      </h2>
      <p style={{ textShadow: '0 4px 14px rgba(255, 255, 255, 0.3)' ,marginBottom: '3rem' }} 
       className="text-[rgba(255,255,255,0.55)] text-base mb-10 max-w-[480px] mx-auto leading-relaxed">
        Rejoignez 2 000 membres qui apprennent et partagent sans argent,
        juste du temps et du talent.
      </p>

      <Button style={{borderRadius:'30px', padding: '8px 20px'}}
      variant="citron" size="lg" asChild>
        <Link style={{ textDecoration: 'none' }} href="/register">Créer mon compte gratuitement →</Link>
      </Button>

    </section>
  )
}
