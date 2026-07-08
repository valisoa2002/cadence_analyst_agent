import { Leaf, Moon, Sun } from "lucide-react";

interface TopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
}

export function TopBar({ isDark, onToggleTheme, onNewChat }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-base-300 bg-base-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-content shadow-sm">
          <Leaf size={18} />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-tight">Kadansa</div>
          <div className="text-xs text-secondary font-medium -mt-0.5">Console TRS &amp; Cadences</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-sm" onClick={onNewChat}>
          + Nouveau chat
        </button>
        <button
          className="btn btn-sm btn-square"
          onClick={onToggleTheme}
          title="Changer de thème"
          aria-label="Changer de thème"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
