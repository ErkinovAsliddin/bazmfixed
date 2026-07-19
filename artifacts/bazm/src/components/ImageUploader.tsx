import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { cn, resolvePhotoSrc } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Multi-image uploader for sellers. Uploads directly to object storage via
 * presigned URLs and returns the served image paths through `onChange`. Shows
 * live thumbnail previews with per-image removal, building buyer trust.
 */
export function ImageUploader({
  value,
  onChange,
  max = 8,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  // Track the latest value so async uploads merge against current state,
  // not the snapshot captured when the upload started (avoids clobbering
  // removals the user made while an upload was in flight).
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const { uploadFile, isUploading } = useUpload({
    onError: () =>
      toast({ title: t("upload.error"), variant: "destructive" }),
  });

  const atLimit = value.length >= max;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    const chosen = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];

    for (const file of chosen) {
      if (!file.type.startsWith("image/")) {
        toast({ title: t("upload.notImage"), variant: "destructive" });
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast({ title: t("upload.tooLarge"), variant: "destructive" });
        continue;
      }
      const res = await uploadFile(file);
      if (res?.objectPath) uploaded.push(res.objectPath);
    }

    if (uploaded.length > 0) onChange([...valueRef.current, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((photo, idx) => (
          <div
            key={`${photo}-${idx}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <img
              src={resolvePhotoSrc(photo)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label={t("upload.remove")}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100"
              data-testid={`image-remove-${idx}`}
            >
              <X className="h-4 w-4" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/85 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                {t("upload.cover")}
              </span>
            )}
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            data-testid="image-add"
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {isUploading ? t("upload.uploading") : t("upload.add")}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="image-input"
      />

      <p className="text-xs text-muted-foreground">
        {t("upload.hint", { max })}
      </p>
    </div>
  );
}
