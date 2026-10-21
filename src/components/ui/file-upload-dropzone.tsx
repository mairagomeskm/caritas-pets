import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileUploadDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  existingUrl?: string | null;
  className?: string;
}

export function FileUploadDropzone({
  file,
  onFileChange,
  accept = "image/*",
  maxSizeMb = 8,
  label = "Foto do pet ou documento",
  hint = "Formatos suportados: JPG, PNG, WEBP até 8MB",
  existingUrl,
  className,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize preview when file changes
  useEffect(() => {
    if (!file) {
      setPreviewUrl(existingUrl ?? null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file, existingUrl]);

  const handleSelectedFile = (selectedFile: File | undefined) => {
    setErrorMsg(null);
    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setErrorMsg(
        `O arquivo excede o limite de ${maxSizeMb}MB. Por favor, escolha um arquivo menor.`,
      );
      return;
    }

    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    handleSelectedFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="text-sm font-semibold text-foreground/90">{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleSelectedFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {previewUrl || file ? (
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-background/80 p-3 shadow-xs">
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Prévia do upload"
                className="h-20 w-20 shrink-0 rounded-lg object-cover border border-primary/30"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <FileCheck className="h-9 w-9" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-sm text-foreground">
                {file ? file.name : "Imagem atual vinculada"}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatSize(file.size)} • {file.type || "Arquivo"}
                </p>
              )}
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-full border-primary/30 hover:bg-primary/10"
                  onClick={() => inputRef.current?.click()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Trocar arquivo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={clearSelection}
                >
                  <X className="h-3.5 w-3.5" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-primary/30 bg-card hover:border-primary/70 hover:bg-primary/5",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            Arraste e solte o arquivo aqui ou{" "}
            <span className="text-primary underline">clique para selecionar</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
      )}

      {errorMsg && <p className="text-xs font-medium text-destructive mt-1">{errorMsg}</p>}
    </div>
  );
}
