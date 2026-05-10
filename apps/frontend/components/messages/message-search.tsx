import { Search } from 'lucide-react';

interface MessageSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export function MessageSearch({ value, onChange }: MessageSearchProps) {
  return (
    <div className="p-4 border-b border-border/50 bg-muted/10">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          className="w-full h-10 bg-background border border-border rounded-xl pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
