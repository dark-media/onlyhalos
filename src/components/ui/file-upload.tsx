"use client";

import * as React from "react";
import { Upload, X, FileIcon, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadFile {
  file: File;
  /** Local object URL for previewing images. */
  preview?: string;
  /** Upload progress 0-100. */
  progress?: number;
  /** Error message if the file was rejected or upload failed. */
  error?: string;
}

export interface FileUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Accepted file types (MIME or extension), e.g. "image/*,.pdf". */
  accept?: string;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Maximum file size in bytes. Defaults to 10 MB. */
  maxSize?: number;
  /** Maximum number of files. Defaults to 10. */
  maxFiles?: number;
  /** Called when files are added (after validation). */
  onChange?: (files: FileUploadFile[]) => void;
  /** Whether an upload is currently in progress. */
  uploading?: boolean;
  /** Disables the dropzone. */
  disabled?: boolean;
  /** Externally controlled file list. */
  value?: FileUploadFile[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_MAX_FILES = 10;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function validateFile(
  file: File,
  accept: string | undefined,
  maxSize: number,
): string | null {
  // Size check
  if (file.size > maxSize) {
    return `File exceeds ${formatBytes(maxSize)} limit`;
  }

  // Type check
  if (accept) {
    const types = accept.split(",").map((t) => t.trim());
    const matches = types.some((type) => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"));
      }
      return file.type === type;
    });
    if (!matches) {
      return `File type "${file.type || "unknown"}" is not accepted`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// FileUpload
// ---------------------------------------------------------------------------

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      className,
      accept,
      multiple = false,
      maxSize = DEFAULT_MAX_SIZE,
      maxFiles = DEFAULT_MAX_FILES,
      onChange,
      uploading = false,
      disabled = false,
      value = [],
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);

    // Clean up object URLs on unmount
    React.useEffect(() => {
      return () => {
        value.forEach((f) => {
          if (f.preview) URL.revokeObjectURL(f.preview);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const processFiles = React.useCallback(
      (incoming: FileList | File[]) => {
        const newFiles: FileUploadFile[] = [];
        const existingCount = value.length;
        const available = maxFiles - existingCount;

        const fileArray = Array.from(incoming).slice(0, multiple ? available : 1);

        for (const file of fileArray) {
          const error = validateFile(file, accept, maxSize);
          const preview = !error && isImageFile(file)
            ? URL.createObjectURL(file)
            : undefined;

          newFiles.push({ file, preview, progress: 0, error: error ?? undefined });
        }

        const next = multiple ? [...value, ...newFiles] : newFiles;
        onChange?.(next);
      },
      [accept, maxFiles, maxSize, multiple, onChange, value],
    );

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (disabled || uploading) return;
        if (e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
        }
      },
      [disabled, uploading, processFiles],
    );

    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !uploading) setIsDragOver(true);
      },
      [disabled, uploading],
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      },
      [],
    );

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          processFiles(e.target.files);
        }
        // Reset so the same file can be selected again
        e.target.value = "";
      },
      [processFiles],
    );

    const handleRemove = React.useCallback(
      (index: number) => {
        const removed = value[index];
        if (removed?.preview) URL.revokeObjectURL(removed.preview);
        const next = value.filter((_, i) => i !== index);
        onChange?.(next);
      },
      [onChange, value],
    );

    const handleClick = () => {
      if (!disabled && !uploading) {
        inputRef.current?.click();
      }
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
        {/* Drop zone */}
        <button
          type="button"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={disabled || uploading}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            (disabled || uploading) && "pointer-events-none opacity-50",
          )}
          aria-label="Upload files"
        >
          {uploading ? (
            <Spinner size="lg" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse
              {accept && ` (${accept})`}
            </p>
            <p className="text-2xs text-muted-foreground">
              Max {formatBytes(maxSize)} per file
              {multiple && ` · Up to ${maxFiles} files`}
            </p>
          </div>
        </button>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />

        {/* File previews */}
        {value.length > 0 && (
          <ul className="flex flex-col gap-2" role="list" aria-label="Selected files">
            {value.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className={cn(
                  "flex items-center gap-3 rounded-md border border-border bg-card p-3",
                  item.error && "border-destructive/50",
                )}
              >
                {/* Thumbnail or icon */}
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </span>
                    {item.error && (
                      <span className="flex items-center gap-1 text-2xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {item.error}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {typeof item.progress === "number" &&
                    !item.error &&
                    item.progress > 0 &&
                    item.progress < 100 && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                          role="progressbar"
                          aria-valuenow={item.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    )}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={uploading}
                  className={cn(
                    "shrink-0 rounded-sm p-1 text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
FileUpload.displayName = "FileUpload";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { FileUpload };
