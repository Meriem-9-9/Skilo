export function ProfileLoader() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-[3rem]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 h-96 bg-muted rounded-3xl" />
        <div className="h-96 bg-muted rounded-3xl" />
      </div>
    </div>
  );
}
