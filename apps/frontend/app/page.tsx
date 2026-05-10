'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (!isOnboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isOnboarded, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full animate-float duration-[10000ms]" />
        
        {/* Floating Particles */}
        <div className="absolute top-[20%] right-[15%] w-4 h-4 bg-primary/30 rounded-full animate-bounce duration-[3000ms]" />
        <div className="absolute bottom-[30%] left-[10%] w-6 h-6 border-2 border-primary/20 rounded-lg rotate-45 animate-bounce duration-[4000ms]" />
        <div className="absolute top-[60%] left-[40%] w-2 h-2 bg-white/20 rounded-full animate-pulse duration-[2000ms]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white hover:opacity-80 transition-opacity">
            skilo<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/login')}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Connexion
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:scale-105 transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              Rejoindre
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center pt-16 px-6 relative z-10">
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            {/* Left Column - Text */}
            <div className="flex flex-col gap-6 text-left order-1">
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary w-fit uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
                Plateforme collaborative
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Echange tes <span className="text-primary italic">skills</span> sans dépenser.
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                Skilo est le réseau où tu enseignes ce que tu maîtrises 
                et tu apprends ce qui te passionne. Le savoir est la seule monnaie.
              </p>

              <div className="flex items-center gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <button 
                  onClick={() => router.push('/register')}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-black hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] transition-all cursor-pointer shadow-2xl shadow-primary/30"
                >
                  Démarrer
                </button>
                <div className="flex -space-x-3 items-center pl-4 border-l border-white/10">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <span className="ml-4 text-xs font-bold text-muted-foreground">+500 membres</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dynamic Cards */}
            <div className="relative order-2 hidden lg:block animate-in fade-in zoom-in duration-1000 delay-300">
              <div className="absolute -inset-10 bg-primary/20 blur-[100px] opacity-20 pointer-events-none" />
              
              <div className="relative h-[450px] w-full max-w-[500px] mx-auto perspective-1000">
                {/* Card 1 */}
                <div className="absolute top-0 right-0 w-[80%] glass p-6 rounded-3xl border border-white/20 shadow-2xl animate-float z-20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-lime-400 flex items-center justify-center font-black text-primary-foreground text-xs shadow-lg">AM</div>
                    <div>
                      <div className="text-xs font-bold text-white">Amine .M</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Expert React</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-primary shadow-[0_0_8px_var(--primary)]" />
                    </div>
                    <div className="h-1.5 w-[60%] bg-white/5 rounded-full" />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-[9px] text-primary font-bold">12 sessions faites</span>
                    <div className="px-2 py-0.5 rounded-full bg-primary/20 text-[8px] font-black text-primary animate-pulse">EN LIGNE</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="absolute bottom-4 left-0 w-[85%] glass p-8 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-10 rotate-[-4deg] hover:rotate-0 transition-transform duration-700 bg-black/60 backdrop-blur-2xl">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-black text-white mb-1 tracking-tight">Match Parfait !</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Compatibilité de 98%</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-sm">✨</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-10">
                    <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary tracking-tighter uppercase">Teaching React</div>
                    <div className="text-muted-foreground text-[10px] animate-pulse">↔</div>
                    <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 tracking-tighter uppercase">Learning Design</div>
                  </div>

                  <button 
                    onClick={() => router.push('/login')}
                    className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black hover:bg-primary transition-all shadow-xl active:scale-95 cursor-pointer"
                  >
                    Démarrer la session
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Subtle Grainy Overlay */}
      <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
    </div>
  );
}
