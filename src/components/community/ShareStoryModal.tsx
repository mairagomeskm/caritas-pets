import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, X, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/storage";

interface AdoptedPetOption {
  id: string;
  name: string;
}

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  adoptedPets: AdoptedPetOption[];
  onSuccess: () => void;
  onRequireAuth: () => void;
}

export function ShareStoryModal({
  isOpen,
  onClose,
  userId,
  adoptedPets,
  onSuccess,
  onRequireAuth,
}: ShareStoryModalProps) {
  const [form, setForm] = useState<{
    pet: string;
    caption: string;
    file: File | null;
    previewUrl: string | null;
  }>({
    pet: "",
    caption: "",
    file: null,
    previewUrl: null,
  });
  const [busy, setBusy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setForm((prev) => ({
        ...prev,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    } else {
      setForm((prev) => ({ ...prev, file: null, previewUrl: null }));
    }
  };

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      onClose();
      return onRequireAuth();
    }
    if (!form.pet || !form.file) {
      return toast.error("Por favor, selecione o pet adotado e envie uma foto ou vídeo.");
    }
    setBusy(true);
    try {
      const url = await uploadMedia(userId, form.file);
      const { error } = await supabase.from("diary_posts").insert({
        pet_id: form.pet,
        author_id: userId,
        media_url: url,
        caption: form.caption.trim() || null,
        media_type: form.file.type.startsWith("video") ? "video" : "image",
      });
      if (error) throw error;
      toast.success("História publicada com sucesso no Mural!");
      setForm({ pet: "", caption: "", file: null, previewUrl: null });
      onClose();
      onSuccess();
    } catch {
      toast.error("Não foi possível publicar no momento. Tente novamente.");
    }
    setBusy(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            Compartilhe a novidade do seu pet adotado
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Publique fotos ou vídeos do dia a dia do seu pet para inspirar novas adoções
            responsáveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={publish} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Pet Adotado
            </label>
            {adoptedPets.length > 0 ? (
              <select
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
                value={form.pet}
                onChange={(e) => setForm({ ...form, pet: e.target.value })}
                required
              >
                <option value="">Selecione o pet adotado</option>
                {adoptedPets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                Cadastre ou conclua a adoção de um pet para vinculá-lo à publicação. Se você é um
                tutor recente, selecione o pet adotado no sistema.
              </div>
            )}
          </div>

          {/* Upload com Preview */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Foto ou Vídeo
            </label>
            {form.previewUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black/5">
                <img src={form.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, file: null, previewUrl: null })}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-colors hover:bg-primary/10">
                <UploadCloud className="h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Clique para selecionar uma foto ou vídeo
                </p>
                <p className="text-xs text-muted-foreground">
                  Metadados EXIF/GPS são removidos automaticamente por segurança.
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Como ele está? (Legenda)
            </label>
            <Textarea
              placeholder="Conte para a comunidade como tem sido a adaptação, brincadeiras e a rotina do pet..."
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-xl text-xs font-bold">
              {busy ? "Publicando..." : "Publicar no Mural"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
