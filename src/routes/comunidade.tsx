import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Heart, BookOpen, Camera, Plus, ShieldCheck, HeartHandshake, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/FilterPill";
import type { PartnerOrg, Article, CommunityPost, FeedItem } from "@/types";
import { PARTNERS, ARTICLES } from "@/data";
import {
  PartnerCard,
  PartnerModal,
  PartnerPixModal,
  ArticleCard,
  ArticleModal,
  CommunityPostCard,
  ShareStoryModal,
  StoriesCarousel,
  StoryViewerModal,
} from "@/components/community";

export type { PartnerOrg, Article, CommunityPost, FeedItem };
export { PARTNERS, ARTICLES };

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade & Parceiros — Carita's Pets DF" },
      {
        name: "description",
        content:
          "Mural oficial da comunidade Carita's Pets: finais felizes de pets adotados, perfil dos projetos parceiros como Resgatados UnB e Lar dos Bigodes, e orientações de posse responsável.",
      },
      { property: "og:title", content: "Comunidade & Parceiros — Carita's Pets DF" },
      {
        property: "og:description",
        content:
          "Veja histórias de pets adotados, conheça os projetos parceiros certificados e acesse dicas de cuidados no Distrito Federal.",
      },
    ],
  }),
  component: ComunidadePage,
});

const CATEGORIES = ["Todos", "Nossos Parceiros", "Finais Felizes", "Dicas & Cuidados"] as const;
type Category = (typeof CATEGORIES)[number];

function ComunidadePage() {
  const { user, setAuthOpen } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<Category>("Todos");
  const [seenStoryIds, setSeenStoryIds] = useState<string[]>([]);
  const [storyViewer, setStoryViewer] = useState<{ posts: CommunityPost[]; i: number } | null>(
    null,
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerOrg | null>(null);
  const [partnerPixModal, setPartnerPixModal] = useState<PartnerOrg | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setSeenStoryIds(JSON.parse(localStorage.getItem("community-diary-seen") ?? "[]"));
      setLikes(JSON.parse(localStorage.getItem("community-post-likes") ?? "{}"));
      setUserLikes(JSON.parse(localStorage.getItem("community-user-likes") ?? "{}"));
    } catch {
      // Ignora erro ao ler localStorage
    }
  }, []);

  const toggleLike = (postId: string) => {
    const isLiked = !!userLikes[postId];
    const newCount = Math.max(0, (likes[postId] ?? 0) + (isLiked ? -1 : 1));
    const nextLikes = { ...likes, [postId]: newCount };
    const nextUserLikes = { ...userLikes, [postId]: !isLiked };
    setLikes(nextLikes);
    setUserLikes(nextUserLikes);
    localStorage.setItem("community-post-likes", JSON.stringify(nextLikes));
    localStorage.setItem("community-user-likes", JSON.stringify(nextUserLikes));
  };

  const markStorySeen = (id: string) =>
    setSeenStoryIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem("community-diary-seen", JSON.stringify(next));
      return next;
    });

  const { data: dbPosts = [] } = useQuery({
    queryKey: ["community-diary-real"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_posts")
        .select("*, pets(name, photo_url)")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as CommunityPost[];
    },
  });

  const { data: adoptedPets = [] } = useQuery({
    queryKey: ["adopted-pets-for-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, photo_url")
        .eq("status", "adotado")
        .order("name");
      if (error) return [];
      return data ?? [];
    },
  });

  const storyGroups = useMemo(() => {
    const map = new Map<string, CommunityPost[]>();
    dbPosts.forEach((p) => map.set(p.pet_id, [...(map.get(p.pet_id) ?? []), p]));
    return [...map.values()];
  }, [dbPosts]);

  const feedItems = useMemo(() => {
    const posts: FeedItem[] = [...dbPosts].map((post) => ({ kind: "post", post }));
    const articles: FeedItem[] = ARTICLES.map((a) => ({ kind: "article", a }));
    const mixed: FeedItem[] = [];

    while (posts.length || articles.length) {
      if (posts.length) mixed.push(posts.shift()!);
      if (posts.length) mixed.push(posts.shift()!);
      if (articles.length) mixed.push(articles.shift()!);
    }

    if (selectedCategory === "Todos") return mixed;
    if (selectedCategory === "Finais Felizes") return mixed.filter((item) => item.kind === "post");
    if (selectedCategory === "Dicas & Cuidados")
      return mixed.filter((item) => item.kind === "article");
    return [];
  }, [dbPosts, selectedCategory]);

  const handleSharePost = async (title: string, text: string) => {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${title} - ${text} | ${window.location.href}`);
      toast.success("Link copiado com sucesso!");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm md:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Users className="h-3.5 w-3.5" />
              <span>Mural Comunitário & Rede de Parceiros DF</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Comunidade <span className="italic text-primary">Carita's Pets</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Conectando famílias que adotaram, organizações parceiras credenciadas e tutores
              conscientes. Histórias de superação, transparência sanitária e orientação veterinária
              para o Distrito Federal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setSelectedCategory("Nossos Parceiros")}
              variant="outline"
              className="rounded-full border-primary/30 text-xs font-bold hover:bg-primary/10"
            >
              <HeartHandshake className="h-4 w-4 mr-1.5 text-primary" />
              Ver Parceiros
            </Button>
            <Button
              onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
              className="rounded-full px-5 text-xs font-bold shadow-md hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Compartilhar História
            </Button>
          </div>
        </div>
      </header>

      <StoriesCarousel
        groups={storyGroups}
        seenIds={seenStoryIds}
        onSelectGroup={(g) => setStoryViewer({ posts: g, i: 0 })}
        onAddStory={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
      />

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {CATEGORIES.map((category) => (
          <FilterPill
            key={category}
            active={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </FilterPill>
        ))}
      </div>

      {(selectedCategory === "Todos" || selectedCategory === "Nossos Parceiros") && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between px-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Rede Credenciada
                </span>
              </div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl mt-0.5">
                Nossos Parceiros Oficiais no DF
              </h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Projetos universitários, abrigos e coletivos que cumprem rigorosos protocolos
              sanitários, testagem e posse responsável.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PARTNERS.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onSelect={setSelectedPartner}
                onOpenPix={setPartnerPixModal}
              />
            ))}
          </div>
        </section>
      )}

      {selectedCategory !== "Nossos Parceiros" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>
                {selectedCategory === "Finais Felizes"
                  ? "Mural de Finais Felizes"
                  : selectedCategory === "Dicas & Cuidados"
                    ? "Guias & Artigos de Cuidados"
                    : `Mural da Comunidade (${feedItems.length})`}
              </span>
            </h2>
            {selectedCategory === "Finais Felizes" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
                className="text-xs text-primary font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Publicar
              </Button>
            )}
          </div>

          {feedItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-card p-10 text-center sm:p-14 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Heart className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-extrabold text-foreground">
                  Seja o primeiro a compartilhar um Final Feliz!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Adotou um companheiro pela Carita's Pets? Compartilhe fotos, vídeos e a evolução
                  do seu pet com a nossa comunidade de protetores e adotantes do DF.
                </p>
              </div>
              <Button
                onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
                className="rounded-full px-6 text-xs font-bold"
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Publicar Novidade do Meu Pet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {feedItems.map((item) =>
                item.kind === "post" ? (
                  <CommunityPostCard
                    key={item.post.id}
                    post={item.post}
                    likesCount={(likes[item.post.id] ?? 0) + (userLikes[item.post.id] ? 1 : 0)}
                    isLiked={!!userLikes[item.post.id]}
                    onToggleLike={toggleLike}
                    onShare={(post) =>
                      handleSharePost(
                        `Final Feliz: ${post.pets?.name ?? "Pet"}`,
                        post.caption ?? "Confira esta história no Carita's Pets!",
                      )
                    }
                  />
                ) : (
                  <ArticleCard key={item.a.id} article={item.a} onRead={setSelectedArticle} />
                ),
              )}
            </div>
          )}
        </section>
      )}

      <PartnerModal
        partner={selectedPartner}
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onNavigateToAdoption={() => navigate({ to: "/adocao" })}
      />

      <PartnerPixModal
        partner={partnerPixModal}
        isOpen={!!partnerPixModal}
        onClose={() => setPartnerPixModal(null)}
      />

      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <ShareStoryModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        userId={user?.id}
        adoptedPets={adoptedPets}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["community-diary-real"] })}
        onRequireAuth={() => setAuthOpen(true)}
      />

      <StoryViewerModal
        viewer={storyViewer}
        onClose={() => setStoryViewer(null)}
        onNavigateStory={(newIdx) => setStoryViewer((v) => (v ? { ...v, i: newIdx } : null))}
        onMarkSeen={markStorySeen}
      />
    </div>
  );
}
