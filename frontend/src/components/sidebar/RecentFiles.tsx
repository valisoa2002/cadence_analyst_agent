import { FileText } from "lucide-react";
import type { FileLogEntry } from "../../lib/api";

export function RecentFiles({ files }: { files: FileLogEntry[] }) {
  if (files.length === 0) {
    return <div className="text-xs text-secondary italic">Aucun export chargé pour l'instant.</div>;
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {files.map((f, i) => {
        const hasIssues = f.n_bloquant > 0;
        return (
          <div
            key={`${f.source_file}-${i}`}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-base-100 border border-base-300 text-sm"
          >
            <FileText size={15} className="shrink-0 text-secondary" />
            <span className="flex-1 truncate" title={f.source_file}>
              {f.source_file}
            </span>
            {hasIssues ? (
              <span className="badge badge-warning badge-sm whitespace-nowrap">
                {f.n_bloquant} à revoir
              </span>
            ) : (
              <span className="badge badge-success badge-sm text-success-content whitespace-nowrap">
                {f.n_rows_inserted} OK
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
