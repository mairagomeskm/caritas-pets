import { useState } from "react";
import type { PetItem } from "@/types/pet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Sparkles, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";

interface PetDetailsModalProps {
  pet: PetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInterest: (pet: PetItem) => void;
  onShare: (pet: PetItem) => void;
}

export function PetDetailsModal({
  pet,
  open,
  onOpenChange,
  onInterest,
  onShare,
}: PetDetailsModalProps) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (!pet) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setActivePhoto(null);
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header Info */}
          <DialogHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1 flex items-center gap-1">
                {pet.species === "cao" ? "🐶 Cachorro" : "🐱 Gatinho"}
              </span>
              {pet.is_puppy && (
                <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs px-2.5 py-0.5">
                  Filhote
                </span>
              )}
              {pet.organization_name && (
                <span className="rounded-full bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 ml-auto flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> {pet.organization_name}
                </span>
              )}
            </div>

            <DialogTitle className="text-3xl sm:text-4xl font-extrabold text-foreground flex items-center justify-between">
              <span>{pet.name}</span>
            </DialogTitle>

            <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1 text-destructive font-semibold">
                <MapPin className="h-4 w-4" /> {pet.region}
              </span>
              <span>•</span>
              <span>{pet.age_label}</span>
              {pet.breed && (
                <>
                  <span>•</span>
                  <span className="text-primary font-bold">{pet.breed}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden bg-neutral-950 border border-primary/25 flex items-center justify-center shadow-md">
              <img
                src={activePhoto || pet.photo_url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none transition-all duration-700"
              />
              <img
                src={activePhoto || pet.photo_url}
                alt={pet.name}
                className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center drop-shadow-2xl transition-transform duration-300 p-1"
              />
              {pet.photos && pet.photos.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20 z-20 flex items-center gap-1.5 shadow-md">
                  📸 Foto {pet.photos.indexOf(activePhoto || pet.photo_url) + 1} de{" "}
                  {pet.photos.length}
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {pet.photos && pet.photos.length > 1 && (
              <div className="flex items-center gap-2.5">
                {pet.photos.map((ph, idx) => {
                  const isSelected = (activePhoto || pet.photo_url) === ph;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhoto(ph)}
                      className={`relative h-18 w-20 overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-neutral-900 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/50 scale-105 shadow-md"
                          : "border-border/80 hover:border-primary/50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={ph}
                        alt={`${pet.name} foto ${idx + 1}`}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Biometric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Espécie</p>
              <p className="font-extrabold text-foreground text-sm">
                {pet.species === "cao" ? "🐶 Canina" : "🐱 Felina"}
              </p>
            </div>
            <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Sexo</p>
              <p className="font-extrabold text-foreground text-sm capitalize">
                {pet.gender === "femea" ? "♀ Fêmea" : "♂ Macho"}
              </p>
            </div>
            <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Idade</p>
              <p className="font-extrabold text-foreground text-sm">{pet.age_label}</p>
            </div>
            <div className="rounded-xl bg-accent/70 p-2.5 border border-primary/20 space-y-0.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Porte Físico</p>
              <p className="font-extrabold text-foreground text-sm capitalize">
                {pet.weight || (pet.size ? `Porte ${pet.size}` : "Porte Médio")}
              </p>
            </div>
          </div>

          {/* Health Protocol */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Protocolo Veterinário & Saúde
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {(pet.health_status || ["Vacinado", "Castrado", "Vermifugado"]).map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs font-bold text-foreground border border-emerald-500/20 shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temperament */}
          {pet.temperament && pet.temperament.length > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> Convivência & Temperamento
              </h4>
              <div className="flex flex-wrap gap-2">
                {pet.temperament.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-background px-3 py-1.5 text-xs font-bold text-foreground border border-primary/30 shadow-2xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Story & Personality */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2 shadow-xs">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-destructive fill-current" /> História do(a) {pet.name}
            </h4>
            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-normal">
              {pet.detailed_story || pet.description}
            </div>
          </div>

          {/* Responsible Organization Box */}
          <div className="rounded-2xl border border-primary/20 bg-accent/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm">
                🐾
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  Instituição / Protetor Responsável
                </p>
                <p className="text-sm font-extrabold text-foreground">
                  {pet.organization_name || "Protetor Independente Parceiro"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Adoção consciente no DF com termo formal e acompanhamento
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => onShare(pet)}
              className="gap-2 border-primary/30 font-bold"
            >
              <Share2 className="h-4 w-4" /> Compartilhar Ficha
            </Button>

            <Button
              size="lg"
              className="flex-1 font-bold gap-2 text-base shadow-md"
              onClick={() => {
                onOpenChange(false);
                onInterest(pet);
              }}
            >
              <Heart className="h-5 w-5 fill-current text-white" />
              Quero Adotar {pet.name} / Falar com o Protetor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
