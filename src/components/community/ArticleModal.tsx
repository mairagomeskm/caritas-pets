import type { Article } from "@/types/partner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface ArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl p-6">
        <div className="space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
            <img src={article.photo} alt={article.title} className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-xs">
              {article.cat}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold leading-tight text-foreground">{article.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{article.readTime}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed text-foreground">
            <p>{article.content}</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
