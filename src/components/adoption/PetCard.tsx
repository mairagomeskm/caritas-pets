import type { PetItem } from "@/types/pet";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Eye, Share2, Sparkles } from "lucide-react";

interface PetCardProps {
  pet: PetItem;
  onSelect: (pet: PetItem) => void;
  onInterest: (pet: PetItem) => void;
  onShare: (pet: PetItem) => void;
}

export function PetCard({ pet, onSelect, onInterest, onShare }: PetCardProps) {
  return (
    <article className="vintage-card group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div>
        {/* Photo & Badges */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950/80 cursor-pointer flex items-center justify-center group"
          onClick={() => onSelect(pet)}
        >
          {/* Ambient backdrop */}
          <img
            src={pet.photo_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
          />
          {/* Centered photo */}
          <img
            src={pet.photo_url}
            alt={pet.name}
            loading="lazy"
            className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
            <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
              {pet.species === "cao" ? "🐶 Cão" : "🐱 Gato"}
            </span>
            {pet.is_puppy && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-xs">
                Filhote
              </span>
            )}
          </div>

          <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md border border-white/20 flex items-center gap-1 z-20">
            <Eye className="h-3.5 w-3.5 text-primary" /> Ver Ficha
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h3
                className="text-2xl font-bold text-foreground hover:text-primary cursor-pointer transition-colors"
                onClick={() => onSelect(pet)}
              >
                {pet.name}
              </h3>
              {pet.gender && (
                <span className="text-xs font-semibold text-muted-foreground capitalize">
                  {pet.gender === "femea" ? "♀ Fêmea" : "♂ Macho"}
                </span>
              )}
            </div>

            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span>{pet.region}</span>
              <span>•</span>
              <span className="font-semibold">{pet.age_label}</span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {pet.description}
          </p>

          {/* Health & Social tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pet.breed && (
              <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-foreground border border-primary/20">
                {pet.breed}
              </span>
            )}
            {pet.weight && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {pet.weight}
              </span>
            )}
            {pet.organization_name && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> {pet.organization_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 pt-0 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="px-2.5 border-primary/30 text-muted-foreground hover:text-foreground"
          onClick={() => onShare(pet)}
          title="Compartilhar pet"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          className="flex-1 font-bold text-xs shadow-sm gap-1.5"
          onClick={() => onInterest(pet)}
        >
          <Heart className="h-4 w-4 fill-current text-white" /> Tenho Interesse
        </Button>
      </div>
    </article>
  );
}
