'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { creditsApi, notificationsApi, CreditBalance, Notification } from '@/lib/api';

// ─── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard',         label: 'Overview',         icon: '▦'  },
  { href: '/dashboard/matches', label: 'Matches',          icon: '⇄'  },
  { href: '/dashboard/sessions',label: 'Sessions',         icon: '📅' },
  { href: '/dashboard/profile', label: 'My Profile',       icon: '👤' },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <span className="text-xl font-bold tracking-tight">skilo</span>
          <span className="ml-1 text-primary text-xl font-bold">.</span>
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
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
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
            1 hour taught = 1 credit ⏱
          </p>
        </div>
      </aside>
    </>
  );
}

// ─── Credits pill ─────────────────────────────────────────────────────────────

function CreditsPill() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);

  useEffect(() => {
    creditsApi.balance().then(setBalance).catch(() => {});
  }, []);

  if (!balance) return null;

  return (
    <Link
      href="/dashboard/credits"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
    >
      <span className="text-sm">🪙</span>
      <span className="text-sm font-semibold text-amber-700">{balance.available}</span>
      {balance.reserved > 0 && (
        <span className="text-xs text-amber-500">+{balance.reserved} réservés</span>
      )}
    </Link>
  );
}

// ─── Notifications bell ───────────────────────────────────────────────────────

function NotificationsBell() {
  const [open, setOpen]             = useState(false);
  const [items, setItems]           = useState<Notification[]>([]);
  const [unread, setUnread]         = useState(0);
  const ref                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsApi.list({ limit: 10 }).then((res) => {
      setItems(res.data);
      setUnread(res.data.filter((n) => !n.isRead).length);
    }).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAll() {
    await notificationsApi.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  const ICONS: Record<string, string> = {
    new_perfect_match:  '🎯',
    match_upgraded:     '⬆️',
    session_proposed:   '📩',
    session_accepted:   '✅',
    session_declined:   '❌',
    session_reminder:   '⏰',
    session_completed:  '🎉',
    review_received:    '⭐',
    badge_earned:       '🏅',
    credits_earned:     '🪙',
    credits_refunded:   '↩️',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune notification</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 text-sm ${n.isRead ? '' : 'bg-primary/5'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">{ICONS[n.type] ?? '📬'}</span>
                    <div className="min-w-0">
                      <p className={`leading-snug ${n.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {String((n.payload as Record<string, unknown>)?.body ?? n.type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Avatar dropdown ──────────────────────────────────────────────────────────

function AvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const router           = useRouter();
  const ref              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors"
        aria-label="Account menu"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-primary">{initials || '?'}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span>👤</span> Mon profil
            </Link>
            <Link
              href="/dashboard/credits"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span>🪙</span> Mes crédits
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <span>↩</span> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Top header ───────────────────────────────────────────────────────────────

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <CreditsPill />
        <NotificationsBell />
        <AvatarMenu />
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading }           = useAuth();
  const router                        = useRouter();

  // Redirect if not authenticated or not onboarded
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    } else if (!isLoading && user && !user.isOnboarded) {
      router.replace('/onboarding');
    }
  }, [user, isLoading, router]);

  // Listen for session expiry
  useEffect(() => {
    function handle() { router.replace('/login'); }
    window.addEventListener('skilo:session-expired', handle);
    return () => window.removeEventListener('skilo:session-expired', handle);
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
