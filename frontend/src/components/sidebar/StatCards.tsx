import type { StatsResponse } from "../../lib/api";

export function StatCards({ stats }: { stats: StatsResponse | null }) {
  const items = [
    { label: "Lignes", value: stats?.n_rows ?? "—" },
    { label: "Produits", value: stats?.n_produits ?? "—" },
    { label: "Machines", value: stats?.n_machines ?? "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="bg-base-300 rounded-lg py-2.5 px-1 text-center">
          <div className="font-mono font-semibold text-accent text-lg">{item.value}</div>
          <div className="text-[0.65rem] uppercase tracking-wide text-secondary mt-0.5">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
