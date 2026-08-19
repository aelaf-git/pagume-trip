import { useRef, useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, X } from "lucide-react";

export default function FileUploadSlot({ label, hint, accept, file, error, onChange, required = false }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file || file.status === "success") {
      setProgress(file?.status === "success" ? 100 : 0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 25;
        if (next >= 100) {
          clearInterval(timer);
          onChange({ ...file, status: "success" });
          return 100;
        }
        return next;
      });
    }, 250);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected) {
      onChange({ name: selected.name, size: selected.size, status: "uploading" });
    }
    e.target.value = "";
  };

  const handleRemove = () => {
    setProgress(0);
    onChange(null);
  };

  return (
    <div className={`rounded-lg border p-4 ${error ? "border-red-300" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </p>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>

        {file ? (
          <div className="flex items-center gap-3">
            {file.status === "success" ? (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {file.name}
              </span>
            ) : (
              <div className="w-40">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-brand-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 shrink-0"
              aria-label={`Remove ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 cursor-pointer shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
