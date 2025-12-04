/**
 * MessageInput Component
 * 
 * Chat input with moderation preview, emoji picker, and rich styling
 */

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Send, ShieldAlert, Smile } from 'lucide-react';
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

// Common emojis organized by category
const EMOJI_CATEGORIES = [
  {
    name: '😊 Smileys',
    emojis: ['😊', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '😂', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐']
  },
  {
    name: '👍 Gestures',
    emojis: ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🙏', '🤝', '💪', '🫶', '❤️', '🧡', '💛', '💚', '💙']
  },
  {
    name: '🎉 Celebrations',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '☑️', '💪', '👑', '🎯', '🚀', '💰', '💵', '🛒', '📦', '🏠', '🔧', '🛠️', '⏰', '📅', '📍']
  },
  {
    name: '💬 Chat',
    emojis: ['💬', '💭', '🗨️', '👀', '😎', '🤝', '📞', '📧', '📩', '✉️', '📝', '📋', '✏️', '🖊️', '📌', '📎', '🔗', '💡', '⚡', '🎯', '❓', '❗', '⁉️', '‼️', '✔️', '❌', '⭕', '➡️', '⬅️', '🔜']
  }
];

export function MessageInput({
  onSend,
  isLoading = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
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

  // Maintain focus after message is sent (when message becomes empty)
  // Use useLayoutEffect to restore focus synchronously before paint
  useLayoutEffect(() => {
    if (message === '' && textareaRef.current && !isLoading) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      });
    }
  }, [message, isLoading]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    const messageToSend = message.trim();
    
    // Store reference to textarea before clearing
    const textarea = textareaRef.current;
    
    // Optimistically clear input immediately
    setMessage('');
    if (textarea) {
      textarea.style.height = 'auto';
    }
    
    // Send the message
    onSend(messageToSend);
    
    // CRITICAL: Restore focus after React updates - use multiple timeouts to ensure it works
    // First attempt immediately after state update
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
    
    // Second attempt after a slightly longer delay (in case of re-render)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
    
    // Third attempt after mutation completes (if needed)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(message + emoji);
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
    <div className={cn("space-y-3", className)} data-testid="message-input-container">
      {/* Moderation Warning */}
      {moderationResult?.wouldBeFiltered && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              ⚠️ Content will be filtered
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Your message contains {formatReasons(moderationResult.reasons)} which will be removed.
              {moderationResult.reasons.includes('contact_info') && (
                <span className="block mt-1 text-xs">
                  🔒 For your safety, please keep all communication on the platform.
                </span>
              )}
            </p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-md inline-block">
              Preview: "{moderationResult.previewContent}"
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          data-testid="message-input"
          className={cn(
            "min-h-[52px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3.5 pr-32 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0",
            moderationResult?.wouldBeFiltered && "text-amber-700"
          )}
          onFocus={(e) => {
            // Ensure cursor is at the end when focused
            const textarea = e.target as HTMLTextAreaElement;
            setTimeout(() => {
              textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }, 0);
          }}
        />
        
        {/* Action buttons */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* Character count */}
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full mr-1",
            message.length > maxLength * 0.9 
              ? "bg-red-100 text-red-600" 
              : "text-muted-foreground/60"
          )}>
            {message.length}/{maxLength}
          </span>
          
          {/* Emoji Picker */}
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Smile className="w-5 h-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="end" 
              className="w-80 p-0"
            >
              <div className="p-3">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Pick an emoji
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {EMOJI_CATEGORIES.map((category) => (
                    <div key={category.name}>
                      <p className="text-xs text-muted-foreground mb-2">{category.name}</p>
                      <div className="grid grid-cols-10 gap-0.5">
                        {category.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              insertEmoji(emoji);
                              setShowEmoji(false);
                            }}
                            className="p-1.5 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size="icon"
            data-testid="send-button"
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              message.trim() 
                ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                : "bg-slate-200 dark:bg-slate-700"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          😊 Emojis supported
        </p>
      </div>
    </div>
  );
}

export default MessageInput;

