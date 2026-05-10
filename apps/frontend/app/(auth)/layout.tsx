import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              skilo<span className="text-primary">.</span>
            </h1>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Ravi de vous revoir</p>
        </div>
        {children}
      </div>
    </main>
  );
}
