import { Loader2 } from 'lucide-react';

export function ChatLoader() {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );
}
