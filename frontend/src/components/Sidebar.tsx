import type { FileLogEntry, StatsResponse, UploadResponse } from "../lib/api";
import { StatCards } from "./sidebar/StatCards";
import { Dropzone } from "./sidebar/Dropzone";
import { RecentFiles } from "./sidebar/RecentFiles";

interface SidebarProps {
  stats: StatsResponse | null;
  files: FileLogEntry[];
  onUploaded: (result: UploadResponse) => void;
}

export function Sidebar({ stats, files, onUploaded }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col gap-6 w-[300px] shrink-0 border-r border-base-300 bg-base-100 p-5 overflow-y-auto">
      <div>
        <div className="text-xs uppercase tracking-wide text-secondary font-semibold mb-2">
          Historique en base
        </div>
        <StatCards stats={stats} />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-secondary font-semibold mb-2">
          Déposer un export
        </div>
        <Dropzone onUploaded={onUploaded} />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-xs uppercase tracking-wide text-secondary font-semibold mb-2">
          Fichiers récents
        </div>
        <RecentFiles files={files} />
      </div>
    </aside>
  );
}
