/**
 * MessageInput Component
 * 
 * Chat input with moderation preview to warn users about filtered content
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface ModerationResult {
  wouldBeFiltered: boolean;
  previewContent: string;
  reasons: string[];
}

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function MessageInput({
  onSend,
  isLoading = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debouncedMessage = useDebounce(message, 500);

  // Check moderation in real-time
  const { data: moderationResult } = useQuery<ModerationResult>({
    queryKey: ['moderate-preview', debouncedMessage],
    queryFn: async () => {
      if (!debouncedMessage || debouncedMessage.length < 3) {
        return { wouldBeFiltered: false, previewContent: '', reasons: [] };
      }
      const res = await fetch('/api/chat/moderate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: debouncedMessage }),
      });
      if (!res.ok) throw new Error('Moderation check failed');
      return res.json();
    },
    enabled: debouncedMessage.length >= 3,
    staleTime: 10000,
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatReasons = (reasons: string[]) => {
    return reasons.map(r => {
      if (r === 'profanity') return 'inappropriate language';
      if (r === 'contact_info') return 'contact information';
      return r;
    }).join(', ');
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Moderation Warning */}
      {moderationResult?.wouldBeFiltered && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Content will be filtered
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Your message contains {formatReasons(moderationResult.reasons)} which will be removed or modified.
              {moderationResult.reasons.includes('contact_info') && (
                <span className="block mt-1">
                  For your safety, please keep all communication on the platform.
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Preview: "{moderationResult.previewContent}"
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-12",
              moderationResult?.wouldBeFiltered && "border-amber-400"
            )}
          />
          <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
            {message.length}/{maxLength}
          </span>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="icon"
          className="h-11 w-11 flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

export default MessageInput;

