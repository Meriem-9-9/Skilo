import { Send, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { uploadApi } from '@/lib/api';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendImage: (imageUrl: string) => void;
  onSuggestMeeting: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onSendImage, onSuggestMeeting, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { avatarUrl } = await uploadApi.avatar(file);
      onSendImage(avatarUrl);
    } catch (err) {
      console.error('Failed to upload image', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-muted/10 border-t border-border/50">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
        <div className="flex gap-1 sm:gap-2">
          {/* Image Upload */}
          <input 
            type="file" 
            id="image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading || disabled}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-border bg-background"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading || disabled}
          >
            {uploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
          </Button>
          
          {/* Meeting Link Suggestion */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10"
            title="Suggérer un appel"
            onClick={onSuggestMeeting}
            disabled={disabled}
          >
            <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 bg-background rounded-2xl border border-border shadow-sm flex items-center overflow-hidden pl-3 pr-1.5 focus-within:ring-2 focus-within:ring-primary/20">
          <input
            type="text"
            placeholder="Écrivez un message..."
            className="flex-1 h-10 sm:h-12 bg-transparent outline-none text-sm w-full min-w-0"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={disabled}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl shrink-0" 
            disabled={!content.trim() || disabled}
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
