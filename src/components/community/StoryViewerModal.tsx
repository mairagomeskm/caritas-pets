import { useEffect } from "react";
import type { CommunityPost } from "@/types/partner";
import { X } from "lucide-react";

interface StoryViewerModalProps {
  viewer: { posts: CommunityPost[]; i: number } | null;
  onClose: () => void;
  onNavigateStory: (newIndex: number) => void;
  onMarkSeen: (id: string) => void;
}

export function StoryViewerModal({
  viewer,
  onClose,
  onNavigateStory,
  onMarkSeen,
}: StoryViewerModalProps) {
  const currentStory = viewer ? viewer.posts[viewer.i] : null;

  useEffect(() => {
    if (!currentStory || !viewer) return;
    onMarkSeen(currentStory.id);
    const t = setTimeout(() => {
      if (viewer.i < viewer.posts.length - 1) {
        onNavigateStory(viewer.i + 1);
      } else {
        onClose();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [currentStory, viewer, onMarkSeen, onNavigateStory, onClose]);

  if (!viewer || !currentStory) return null;

  const handleNext = () => {
    if (viewer.i < viewer.posts.length - 1) {
      onNavigateStory(viewer.i + 1);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-sm flex-col justify-between overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barras de Progresso dos Stories */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {viewer.posts.map((p, i) => (
            <div key={p.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className={`h-full bg-white transition-all ${
                  i < viewer.i ? "w-full" : i === viewer.i ? "animate-story" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho do Story */}
        <div className="absolute inset-x-3 top-6 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 drop-shadow">
            <img
              src={currentStory.pets?.photo_url ?? currentStory.media_url}
              alt={currentStory.pets?.name ?? "Pet"}
              className="h-8 w-8 rounded-full border border-white object-cover"
            />
            <span className="font-bold text-sm">{currentStory.pets?.name ?? "Amigo Adotado"}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full bg-black/40 p-1 text-white hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mídia do Story */}
        <div
          className="flex h-full w-full items-center justify-center cursor-pointer"
          onClick={handleNext}
        >
          {currentStory.media_type === "video" ? (
            <video
              src={currentStory.media_url}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={currentStory.media_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {/* Legenda do Story */}
        {currentStory.caption && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 text-center text-white">
            <p className="text-sm font-medium drop-shadow leading-relaxed">
              "{currentStory.caption}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
