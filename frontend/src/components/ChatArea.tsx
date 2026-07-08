import { useEffect, useRef } from "react";
import type { Message } from "../hooks/useChat";
import { MessageBubble } from "./chat/MessageBubble";
import { SuggestionChips } from "./chat/SuggestionChips";
import { InputBar } from "./chat/InputBar";
import { Loader2 } from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  onSend: (text: string) => void;
  sending: boolean;
}

export function ChatArea({ messages, onSend, sending }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-secondary text-sm mt-10">
            Posez une question sur vos cadences de production, ou déposez d'abord un export Excel
            dans la barre latérale.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-secondary text-sm">
            <Loader2 size={16} className="animate-spin" /> L'agent réfléchit...
          </div>
        )}
      </div>

      <SuggestionChips onPick={onSend} />
      <InputBar onSend={onSend} disabled={sending} />
    </main>
  );
}
