'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowRightLeft, Calendar, User, MessageCircle } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/matches',   label: 'Matches',    icon: <ArrowRightLeft className="w-5 h-5" /> },
  { href: '/sessions',  label: 'Sessions',   icon: <Calendar className="w-5 h-5" /> },
  { href: '/messages',  label: 'Messages',   icon: <MessageCircle className="w-5 h-5" /> },
  { href: '/profile',   label: 'Mon Profil', icon: <User className="w-5 h-5" /> },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-card border-r border-border z-30
        flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-foreground hover:opacity-80 transition-opacity">
            skilo<span className="text-primary">.</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            1 heure enseignée = 1 crédit ⏱
          </p>
        </div>
      </aside>
    </>
  );
}
