import { Download } from "lucide-react";
import { api } from "./lib/api";
import type { RecommendationTable as RecommendationTableData } from "./lib/api";

function formatNumber(value: number | null, unit = ""): string {
  if (value === null) return "N/A";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${unit}`;
}

function formatSigned(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%`;
}

interface RecommendationTableProps {
  table: RecommendationTableData;
}

export function RecommendationTable({ table }: RecommendationTableProps) {
  if (table.rows.length === 0) return null;

  const singleMatch = table.rows.length === 1 ? table.rows[0] : null;
  const downloadUrl = api.exportRecommendationsUrl(
    singleMatch ? { produit: singleMatch.produit, machine: singleMatch.machine } : undefined
  );

  return (
    <div className="mt-3 rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="bg-base-300 text-xs uppercase tracking-wide">
              <th>Produit</th>
              <th>Machine</th>
              <th>Statut</th>
              <th className="font-mono">Théorique</th>
              <th className="font-mono">Recommandée</th>
              <th className="font-mono">Écart</th>
              <th className="font-mono">TRS réf.</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={`${row.produit}-${row.machine}-${i}`} className="text-sm">
                <td className="max-w-[180px] truncate" title={row.produit}>{row.produit}</td>
                <td className="max-w-[140px] truncate" title={row.machine}>{row.machine}</td>
                <td>
                  {row.fiable ? (
                    <span className="badge badge-success badge-sm text-success-content whitespace-nowrap">✓ Fiable</span>
                  ) : (
                    <span className="badge badge-warning badge-sm whitespace-nowrap">⚠ À vérifier</span>
                  )}
                </td>
                <td className="font-mono">{formatNumber(row.cadence_theorique_actuelle, " pcs/min")}</td>
                <td className="font-mono font-semibold text-primary">{formatNumber(row.cadence_recommandee, " pcs/min")}</td>
                <td className="font-mono">{formatSigned(row.ecart_vs_theorique_pct)}</td>
                <td className="font-mono">{formatNumber(row.trs_moyen_reference, "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href={downloadUrl}
        download
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-base-300 border-t border-base-300 transition-colors"
      >
        <Download size={14} />
        Télécharger en Excel
      </a>
    </div>
  );
}