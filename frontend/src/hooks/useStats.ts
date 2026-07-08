import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { FileLogEntry, StatsResponse } from "../lib/api";

export function useStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [files, setFiles] = useState<FileLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, filesData] = await Promise.all([api.stats(), api.files()]);
      setStats(statsData);
      setFiles(filesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, files, loading, error, refresh };
}
