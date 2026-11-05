import type { CommunityPost } from "@/types/partner";
import { Heart, Share2 } from "lucide-react";

interface CommunityPostCardProps {
  post: CommunityPost;
  likesCount: number;
  isLiked: boolean;
  onToggleLike: (postId: string) => void;
  onShare: (post: CommunityPost) => void;
}

export function CommunityPostCard({
  post,
  likesCount,
  isLiked,
  onToggleLike,
  onShare,
}: CommunityPostCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <article className="vintage-card flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between border-b border-border/40 p-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src={post.pets?.photo_url ?? post.media_url}
              alt={post.pets?.name ?? "Pet"}
              className="h-9 w-9 rounded-full border border-primary/20 object-cover"
            />
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {post.pets?.name ?? "Pet Adotado"}
              </h3>
              <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Final Feliz
          </span>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={post.media_url}
            alt={post.caption ?? "Final feliz"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="p-3.5">
          <p className="text-xs sm:text-sm italic leading-relaxed text-foreground/90">
            "{post.caption || "Vivendo uma nova vida com muito amor e carinho!"}"
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-3.5 py-2.5 text-xs text-muted-foreground">
        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1.5 font-medium transition-colors ${
            isLiked ? "text-rose-600" : "hover:text-primary"
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
          <span>{likesCount} curtidas</span>
        </button>

        <button
          onClick={() => onShare(post)}
          className="flex items-center gap-1.5 transition-colors hover:text-primary"
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </button>
      </div>
    </article>
  );
}
