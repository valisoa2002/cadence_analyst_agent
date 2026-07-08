const SUGGESTIONS = [
  "Quelles machines sont les plus stables ?",
  "Pourquoi cette machine est moins performante ?",
  "Quelle cadence recommandes-tu pour le produit FL016 ?",
];

export function SuggestionChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 md:px-8 pb-3">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-base-300 bg-base-100 hover:bg-base-300 hover:border-secondary transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
