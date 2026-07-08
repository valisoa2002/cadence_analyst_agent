const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

export interface StatsResponse {
  n_rows: number;
  n_produits: number;
  n_machines: number;
}

export interface FileLogEntry {
  source_file: string;
  imported_at: string;
  n_rows_extracted: number;
  n_rows_inserted: number;
  n_rows_skipped_duplicate: number;
  n_bloquant: number;
  n_avertissement: number;
  n_info: number;
}

export interface ChatResponse {
  answer: string;
  llm_mode: boolean;
}

export interface UploadResponse {
  source_file: string;
  n_rows_extracted: number;
  n_rows_inserted: number;
  n_rows_skipped_duplicate: number;
  n_bloquant: number;
  n_avertissement: number;
  n_info: number;
}

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // pas de corps JSON exploitable, on garde le statusText
    }
    throw new ApiError(detail, response.status);
  }
  return response.json();
}

export const api = {
  async health(): Promise<{ status: string; database: string }> {
    const res = await fetch(`${API_BASE}/api/health`);
    return handle(res);
  },

  async stats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE}/api/stats`);
    return handle(res);
  },

  async files(): Promise<FileLogEntry[]> {
    const res = await fetch(`${API_BASE}/api/files`);
    return handle(res);
  },

  async chat(message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return handle(res);
  },

  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
    return handle(res);
  },
};

export { ApiError };
