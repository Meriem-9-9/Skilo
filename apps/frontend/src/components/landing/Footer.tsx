import Link from 'next/link'

const FOOTER_COLS = [
  {
    title: 'Produit',
    links: ['Comment ça marche', 'Fonctionnalités', 'Crédits temps', 'Algorithme'],
  },
  {
    title: 'Communauté',
    links: ['Explorer les profils', 'Compétences populaires', 'Blog'],
  },
  {
    title: 'Légal',
    links: ['CGU', 'Confidentialité', 'Cookies'],
  },
]

const SOCIALS = ['𝕏', 'in', 'ig']

export function Footer() {
  return (
    <footer className="bg-[#0d0820] px-[5%] pt-16 pb-8 border-t border-[rgba(255,255,255,0.06)]">

      {/* ── Colonnes ── */}
      <div className="flex flex-wrap items-start justify-between gap-10 mb-12">

        {/* Brand */}
        <div>
          <p className="font-display text-[1.3rem] font-extrabold mb-[10px]">
            <span className="text-[#ffffff]">Skill</span>
            <span className="text-[#D4F000]">Swap</span>
          </p>
          <p className="text-[rgba(255,255,255,0.40)] text-[0.85rem] leading-relaxed max-w-[260px]">
            La plateforme qui transforme le savoir en monnaie d'échange.
            100% gratuit, 100% humain.
          </p>
        </div>

        {/* Liens */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-[0.85rem] font-bold text-[#ffffff] mb-[14px] tracking-[0.05em] uppercase">
              {col.title}
            </h4>
            <ul className="list-none flex flex-col gap-[9px]">
              {col.links.map((label) => (
                <li key={label}>
                  <Link
                    href="#"
                    className="text-[rgba(255,255,255,0.45)] text-[0.85rem] hover:text-[#D4F000] transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-7 border-t border-[rgba(255,255,255,0.07)]">
        <p className="text-[rgba(255,255,255,0.30)] text-[0.78rem]">
          © 2025 SkillSwap — Tous droits réservés
        </p>
        <div className="flex gap-[10px]">
          {SOCIALS.map((icon) => (
            <Link
              key={icon}
              href="#"
              className="w-[34px] h-[34px] rounded-lg border border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[rgba(255,255,255,0.50)] text-[0.85rem] hover:border-[#D4F000] hover:text-[#D4F000] transition-all duration-200"
            >
              {icon}
            </Link>
          ))}
        </div>
      </div>

    </footer>
  )
}
