import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import type { UploadResponse } from "../../lib/api";

interface DropzoneProps {
  onUploaded: (result: UploadResponse) => void;
}

export function Dropzone({ onUploaded }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().match(/\.(xlsx|xlsm)$/)) {
        setStatus("error");
        setErrorMessage("Seuls les fichiers .xlsx/.xlsm sont acceptés.");
        return;
      }
      setStatus("uploading");
      setErrorMessage(null);
      try {
        const result = await api.upload(file);
        onUploaded(result);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof ApiError ? err.message : "Échec de l'envoi.");
      }
    },
    [onUploaded]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors bg-base-300 ${
          isDragging ? "border-primary bg-base-200" : "border-secondary/50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        {status === "uploading" ? (
          <Loader2 className="mx-auto mb-1 animate-spin" size={22} />
        ) : (
          <UploadCloud className="mx-auto mb-1" size={22} />
        )}
        <div className="text-sm font-semibold">
          {status === "uploading" ? "Envoi en cours..." : "Glissez un fichier .xlsx"}
        </div>
        <div className="text-xs text-secondary mt-0.5">ou cliquez pour parcourir</div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {status === "error" && errorMessage && (
        <div className="text-xs text-error mt-1.5">{errorMessage}</div>
      )}
    </div>
  );
}
