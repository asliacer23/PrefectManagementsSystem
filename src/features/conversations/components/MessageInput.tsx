import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    try {
      setLoading(true);
      await onSendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || loading || !message.trim();

  return (
    <div className="flex gap-3 items-end w-full bg-muted/30 rounded-lg p-3 border border-border shadow-sm">
      <Textarea
        placeholder="Type a message... (Ctrl+Enter to send)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className="min-h-[44px] max-h-[120px] resize-none text-sm md:text-base flex-1 bg-background border-border"
      />
      <Button
        onClick={handleSend}
        disabled={isDisabled}
        size="icon"
        className="flex-shrink-0 h-11 w-11 md:h-12 md:w-12"
        title="Send message"
      >
        <SendIcon className="w-5 h-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}
