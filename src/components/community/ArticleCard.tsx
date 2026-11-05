import type { Article } from "@/types/partner";
import { Clock, ChevronRight } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  onRead: (article: Article) => void;
}

export function ArticleCard({ article, onRead }: ArticleCardProps) {
  return (
    <article className="vintage-card flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={article.photo}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-xs">
              {article.cat}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 p-4">
          <h3 className="text-base font-bold leading-snug text-foreground">{article.title}</h3>
          <p className="line-clamp-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {article.readTime}
        </span>

        <button
          onClick={() => onRead(article)}
          className="flex items-center gap-1 font-bold text-primary transition-colors hover:underline"
        >
          <span>Ler artigo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
