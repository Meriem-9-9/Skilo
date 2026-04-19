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
          <h1 className="text-3xl font-bold tracking-tight">Skilo</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back 👋</p>
        </div>
        {children}
      </div>
    </main>
  );
}
