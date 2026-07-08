import { Leaf } from "lucide-react";
import type { Message } from "../../hooks/useChat";
import { renderMinimalMarkdown } from "../../lib/markdown";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-primary text-primary-content rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[75%]">
      <div className="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center shrink-0">
        <Leaf size={15} />
      </div>
      {/* Style "fiche technique" : bordure pointillée en haut, même en réponse texte libre,
          pour garder l'identité visuelle même tant que le backend ne renvoie pas de données structurées. */}
      <div
        className={`rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed shadow-sm ${
          message.isError
            ? "bg-error/10 border-error/30 text-error"
            : "bg-base-100 border-base-300"
        }`}
      >
        <div dangerouslySetInnerHTML={{ __html: renderMinimalMarkdown(message.text) }} />
      </div>
    </div>
  );
}
