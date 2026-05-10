export function SessionDetailLoader() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-[2.5rem]" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-48 bg-muted rounded-3xl" />
        <div className="h-48 bg-muted rounded-3xl" />
      </div>
    </div>
  );
}
