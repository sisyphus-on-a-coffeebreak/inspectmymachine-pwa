// src/components/forms/RHUpload.tsx
import * as React from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useUploader, type UploadResult } from "@/lib/upload";

type BaseProps<T extends FieldValues> = {
  control: Control<T>;
  /** Path of the field where the uploaded object will be stored */
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
  /** Optional upload folder prefix on the backend (e.g. `inspections/{id}`) */
  prefix?: string;
  /** If provided, show a small hint under the control */
  hint?: string;
};

type CaptureCommon = {
  /** mobile capture hint: "environment" (rear camera) or "user" (front). */
  capture?: boolean | "environment" | "user";
};

function formatBytes(n?: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = React.useState<string | undefined>();
  React.useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

/** Image (single) */
export function RHImageCapture<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  prefix,
  hint,
  capture = "environment",
}: BaseProps<T> & CaptureCommon) {
  const { uploadImageWithProgress } = useUploader();
  const [localFile, setLocalFile] = React.useState<File | undefined>();
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const previewUrl = useObjectUrl(localFile);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error: fErr } }) => (
        <div className="space-y-2">
          {label ? <label className="text-sm font-medium">{label}</label> : null}

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              capture={capture as unknown as boolean}
              className="hidden"
              id={`${String(name)}__file`}
              disabled={disabled}
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                setError(undefined);
                setLocalFile(file);
                setProgress(0);
                try {
                  const res = await uploadImageWithProgress(file, prefix, setProgress);
                  // store the object returned by backend in the form field
                  onChange(res as unknown as UploadResult);
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                  setLocalFile(undefined);
                  setProgress(undefined);
                }
              }}
            />
            <label htmlFor={`${String(name)}__file`}>
              <Button type="button" disabled={disabled}>
                {value ? "Replace Photo" : "Capture / Upload Photo"}
              </Button>
            </label>

            {progress != null && progress < 100 && (
              <span className="text-xs opacity-70">Uploading… {progress}%</span>
            )}
          </div>

          {/* Preview (local if available, else just metadata) */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="mt-2 h-28 w-28 object-cover rounded border dark:border-zinc-800"
            />
          ) : value ? (
            <div className="text-xs opacity-70">
              Stored: {(value as UploadResult).key}{" "}
              {formatBytes((value as UploadResult).size)}
            </div>
          ) : null}

          {/* Hints / errors */}
          {hint ? <div className="text-xs opacity-60">{hint}</div> : null}
          {error || fErr?.message ? (
            <div className="text-xs text-red-600">{error ?? fErr?.message}</div>
          ) : null}
        </div>
      )}
    />
  );
}

/** Video (single) */
export function RHVideoCapture<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  prefix,
  hint,
  capture = "environment",
}: BaseProps<T> & CaptureCommon) {
  const { uploadImageWithProgress } = useUploader(); // same endpoint; backend detects mime
  const [localFile, setLocalFile] = React.useState<File | undefined>();
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const previewUrl = useObjectUrl(localFile);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error: fErr } }) => (
        <div className="space-y-2">
          {label ? <label className="text-sm font-medium">{label}</label> : null}

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="video/*"
              capture={capture as unknown as boolean}
              className="hidden"
              id={`${String(name)}__file`}
              disabled={disabled}
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                setError(undefined);
                setLocalFile(file);
                setProgress(0);
                try {
                  const res = await uploadImageWithProgress(file, prefix, setProgress);
                  onChange(res as unknown as UploadResult);
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                  setLocalFile(undefined);
                  setProgress(undefined);
                }
              }}
            />
            <label htmlFor={`${String(name)}__file`}>
              <Button type="button" disabled={disabled}>
                {value ? "Replace Video" : "Capture / Upload Video"}
              </Button>
            </label>

            {progress != null && progress < 100 && (
              <span className="text-xs opacity-70">Uploading… {progress}%</span>
            )}
          </div>

          {/* Preview if we have a local recording */}
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="mt-2 w-full max-w-xs rounded border dark:border-zinc-800"
            />
          ) : value ? (
            <div className="text-xs opacity-70">
              Stored: {(value as UploadResult).key}{" "}
              {formatBytes((value as UploadResult).size)}
            </div>
          ) : null}

          {hint ? <div className="text-xs opacity-60">{hint}</div> : null}
          {error || fErr?.message ? (
            <div className="text-xs text-red-600">{error ?? fErr?.message}</div>
          ) : null}
        </div>
      )}
    />
  );
}

// Optional default (so `import RHUpload from ...` also works)
export default { RHImageCapture, RHVideoCapture };
