import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex gap-2 px-4 md:px-8 pb-5 pt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question sur les cadences ou le TRS..."
        disabled={disabled}
        className="input input-bordered flex-1 bg-base-100 focus:outline-primary"
      />
      <button
        onClick={submit}
        disabled={disabled}
        className="btn btn-primary btn-square"
        aria-label="Envoyer"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
