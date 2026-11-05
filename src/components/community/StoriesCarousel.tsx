import type { CommunityPost } from "@/types/partner";
import { Plus, Sparkles } from "lucide-react";

interface StoriesCarouselProps {
  groups: CommunityPost[][];
  seenIds: string[];
  onSelectGroup: (group: CommunityPost[]) => void;
  onAddStory: () => void;
}

export function StoriesCarousel({
  groups,
  seenIds,
  onSelectGroup,
  onAddStory,
}: StoriesCarouselProps) {
  if (groups.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Diário dos Pets Adotados (Stories)
        </h2>
        <span className="text-xs text-muted-foreground">Toque para assistir</span>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1">
        {/* Botão de adicionar story */}
        <button
          onClick={onAddStory}
          className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/30 transition-all group-hover:border-primary group-hover:bg-secondary/60">
            <Plus className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[11px] font-semibold text-foreground">Novo post</span>
        </button>

        {groups.map((g) => {
          const unseen = g.some((p) => !seenIds.includes(p.id));
          const first = g[0]!;
          const pet = first.pets;
          return (
            <button
              key={first.pet_id}
              onClick={() => onSelectGroup(g)}
              className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`rounded-2xl p-0.5 transition-transform group-hover:scale-105 ${
                  unseen
                    ? "bg-gradient-to-tr from-emerald-600 via-primary to-accent shadow-sm"
                    : "bg-border/80"
                }`}
              >
                <img
                  src={pet?.photo_url ?? first.media_url}
                  alt={pet?.name ?? "Pet"}
                  className="h-16 w-16 rounded-[14px] border-2 border-card object-cover"
                />
              </div>
              <span className="max-w-[76px] truncate text-center text-[11px] font-semibold text-foreground">
                {pet?.name ?? "Amigo"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
