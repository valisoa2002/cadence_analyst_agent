import { useCallback, useState } from "react";
import { api } from "../lib/api";

export interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  isError?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [llmMode, setLlmMode] = useState<boolean | null>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const response = await api.chat(text);
      setLlmMode(response.llm_mode);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "agent", text: response.answer },
      ]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Erreur inconnue";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: `Impossible de contacter l'agent (${detail}). Vérifiez que le backend tourne bien.`,
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, []);

  return { messages, send, sending, llmMode };
}
