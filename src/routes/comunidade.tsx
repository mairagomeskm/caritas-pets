import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  BookOpen,
  Camera,
  X,
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterPill } from "@/components/FilterPill";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Carita's Pets" },
      {
        name: "description",
        content:
          "Mural da comunidade Carita's Pets: finais felizes de pets adotados, ONGs parceiras e dicas práticas de cuidados.",
      },
      { property: "og:title", content: "Comunidade Carita's — Mural Público" },
      {
        property: "og:description",
        content:
          "Veja histórias de amor, animais adotados com suas novas famílias e orientações de posse responsável no DF.",
      },
    ],
  }),
  component: ComunidadePage,
});

const CATS = ["Finais Felizes", "Conheça nossas ONGs parceiras", "Dicas de Cuidados"] as const;
type Cat = (typeof CATS)[number];
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

type Article = {
  cat: Cat;
  title: string;
  summary: string;
  photo: string;
  readTime: string;
  content: string;
};

const ARTICLES: Article[] = [
  {
    cat: "Conheça nossas ONGs parceiras",
    title: "Um abrigo cheio de histórias",
    summary: "Conheça o trabalho de resgate, castração e lar temporário feito por voluntários dedicados no DF.",
    photo: img("photo-1601758228041-f3b2795255f1"),
    readTime: "3 min de leitura",
    content:
      "No Distrito Federal, dezenas de protetores e instituições independentes dedicam suas vidas ao resgate e reabilitação de animais em situação de vulnerabilidade. Cada resgate envolve cuidados veterinários, vacinação, castração e muito carinho para preparar o pet para um lar definitivo. Apoie o trabalho doando ração, participando de feiras de adoção ou oferecendo lar temporário!",
  },
  {
    cat: "Dicas de Cuidados",
    title: "Telas de proteção salvam vidas",
    summary: "Por que janelas e varandas teladas são indispensáveis para quem tem gatos em apartamento ou sobrado.",
    photo: img("photo-1514888286974-6c03e2ca1dba"),
    readTime: "2 min de leitura",
    content:
      "Gatos são curiosos por natureza e possuem forte instinto caçador. Uma simples borboleta ou pássaro na janela pode causar uma queda fatal (conhecida como 'síndrome do gato voador'). Redes de proteção certificadas e instaladas por profissionais em todas as janelas e vãos da residência evitam acidentes e garantem que seu felino explore a casa com total segurança.",
  },
  {
    cat: "Dicas de Cuidados",
    title: "Carteirinha de vacinas em dia",
    summary: "V8/V10, antirrábica e vermífugo: o calendário básico de prevenção para o primeiro ano de vida.",
    photo: img("photo-1583337130417-3346a1be7dee"),
    readTime: "4 min de leitura",
    content:
      "A prevenção é o maior ato de amor pelo seu companheiro. Cães precisam das doses polivalentes (V8 ou V10) e da vacina antirrábica anual, além da proteção contra giardíase e tosse dos canis. Já os gatos precisam da vacina quádrupla ou quíntupla (V4/V5) e antirrábica. Mantenha os vermífugos e antiparasitários contra pulgas e carrapatos rigorosamente atualizados.",
  },
  {
    cat: "Conheça nossas ONGs parceiras",
    title: "Voluntariado que transforma",
    summary: "Como ajudar abrigos e protetores mesmo sem adotar: carona solidária, doações e lar temporário.",
    photo: img("photo-1450778869180-41d0601e046e"),
    readTime: "3 min de leitura",
    content:
      "Não tem espaço ou tempo para adotar agora? Você ainda pode fazer uma enorme diferença! As ONGs de Brasília estão sempre precisando de 'táxi pet' para levar animais a consultas veterinárias, fotógrafos voluntários para produzir fotos dos animais para o catálogo, doações de cobertores, produtos de limpeza, ração e remédios.",
  },
];

type Post = {
  id: string;
  pet_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  pets: { name: string; photo_url: string | null } | null;
};

const DEFAULT_POSTS: Post[] = [
  {
    id: "sample-1",
    pet_id: "seed-1",
    media_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80",
    media_type: "image",
    caption: "A Mel já está completamente adaptada ao novo lar! Adora dormir no sol da manhã e ronronar no colo da família.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pets: { name: "Mel", photo_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80" },
  },
  {
    id: "sample-2",
    pet_id: "seed-2",
    media_url: "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=800&q=80",
    media_type: "image",
    caption: "Thor no seu primeiro passeio no Parque da Cidade! Correu, brincou e fez muitos amigos caninos.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    pets: { name: "Thor", photo_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80" },
  },
  {
    id: "sample-3",
    pet_id: "seed-3",
    media_url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80",
    media_type: "image",
    caption: "Frida agora é a rainha do sofá da sala. Um doce de companheira que alegra nossos dias!",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    pets: { name: "Frida", photo_url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80" },
  },
];

type FeedItem = { kind: "post"; post: Post } | { kind: "article"; a: Article };

function ComunidadePage() {
  const { user, setAuthOpen } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState<Cat | "Todos">("Todos");
  const [seen, setSeen] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{ posts: Post[]; i: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSeen(JSON.parse(localStorage.getItem("diary-seen") ?? "[]"));
    setLikes(JSON.parse(localStorage.getItem("post-likes") ?? "{}"));
    setUserLikes(JSON.parse(localStorage.getItem("user-likes") ?? "{}"));
  }, []);

  const toggleLike = (postId: string) => {
    const isLiked = !!userLikes[postId];
    const newCount = Math.max(0, (likes[postId] ?? 0) + (isLiked ? -1 : 1));
    const nextLikes = { ...likes, [postId]: newCount };
    const nextUserLikes = { ...userLikes, [postId]: !isLiked };
    setLikes(nextLikes);
    setUserLikes(nextUserLikes);
    localStorage.setItem("post-likes", JSON.stringify(nextLikes));
    localStorage.setItem("user-likes", JSON.stringify(nextUserLikes));
  };

  const markSeen = (id: string) =>
    setSeen((s) => {
      if (s.includes(id)) return s;
      const n = [...s, id];
      localStorage.setItem("diary-seen", JSON.stringify(n));
      return n;
    });

  const { data: dbPosts = [] } = useQuery({
    queryKey: ["diary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_posts")
        .select("*, pets(name, photo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const posts = useMemo(() => {
    return dbPosts.length > 0 ? dbPosts : DEFAULT_POSTS;
  }, [dbPosts]);

  const { data: adopted = [] } = useQuery({
    queryKey: ["pets", "adotado"],
    queryFn: async () => (await supabase.from("pets").select("id, name").eq("status", "adotado")).data ?? [],
  });

  // Agrupamento dos posts para o carrossel de stories no topo
  const groups = useMemo(() => {
    const m = new Map<string, Post[]>();
    posts.forEach((p) => m.set(p.pet_id, [...(m.get(p.pet_id) ?? []), p]));
    return [...m.values()];
  }, [posts]);

  // Feed equilibrado: intercala atualizações com artigos educativos
  const feed = useMemo(() => {
    const ps: FeedItem[] = [...posts].map((post) => ({ kind: "post", post }));
    const as: FeedItem[] = ARTICLES.map((a) => ({ kind: "article", a }));
    const out: FeedItem[] = [];

    while (ps.length || as.length) {
      if (ps.length) out.push(ps.shift()!);
      if (ps.length) out.push(ps.shift()!);
      if (as.length) out.push(as.shift()!);
    }

    return out.filter((f) =>
      cat === "Todos" ? true : f.kind === "post" ? cat === "Finais Felizes" : f.a.cat === cat,
    );
  }, [posts, cat]);

  // Visualizador automático de stories (5 segundos por foto)
  const currentStory = viewer ? viewer.posts[viewer.i] : null;
  useEffect(() => {
    if (!currentStory) return;
    markSeen(currentStory.id);
    const t = setTimeout(() => {
      setViewer((v) => (v && v.i < v.posts.length - 1 ? { ...v, i: v.i + 1 } : null));
    }, 5000);
    return () => clearTimeout(t);
  }, [currentStory]);

  // Formulário para compartilhar história
  const [form, setForm] = useState<{ pet: string; caption: string; file: File | null; previewUrl: string | null }>({
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
    if (!user) {
      setShowShareModal(false);
      return setAuthOpen(true);
    }
    if (!form.pet || !form.file) {
      return toast.error("Por favor, selecione o pet e uma imagem ou vídeo.");
    }
    setBusy(true);
    try {
      const url = await uploadMedia(user.id, form.file);
      const { error } = await supabase.from("diary_posts").insert({
        pet_id: form.pet,
        author_id: user.id,
        media_url: url,
        caption: form.caption.trim() || null,
        media_type: form.file.type.startsWith("video") ? "video" : "image",
      });
      if (error) throw error;
      toast.success("História publicada com sucesso! Os protetores foram notificados.");
      setForm({ pet: "", caption: "", file: null, previewUrl: null });
      setShowShareModal(false);
      qc.invalidateQueries({ queryKey: ["diary"] });
    } catch {
      toast.error("Não foi possível publicar no momento. Tente novamente.");
    }
    setBusy(false);
  };

  const handleSharePost = async (title: string, text: string) => {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${title} - ${text} | ${window.location.href}`);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Cabeçalho Harmônico */}
      <header className="rounded-2xl border border-primary/20 bg-card/95 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 text-primary">
                <Users className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mural Carita's
              </span>
            </div>
            <h1 className="text-3xl font-extrabold italic tracking-tight text-primary sm:text-4xl">
              Comunidade & Finais Felizes
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Acompanhe a nova vida dos animais adotados, conheça as ONGs parceiras e descubra dicas valiosas.
            </p>
          </div>

          <Button
            onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 shadow-md transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Compartilhar Novidade</span>
          </Button>
        </div>
      </header>

      {/* Carrossel de Stories Elegante */}
      {groups.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Diário dos Adotados (Stories)
            </h2>
            <span className="text-xs text-muted-foreground">Toque para assistir</span>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-2">
            {/* Botão de adicionar story se logado */}
            <button
              onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
              className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-secondary/30 transition-all group-hover:border-primary group-hover:bg-secondary/60">
                <Plus className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              </div>
              <span className="text-xs font-medium text-foreground">Novo post</span>
            </button>

            {groups.map((g) => {
              const unseen = g.some((p) => !seen.includes(p.id));
              const first = g[0]!;
              const pet = first.pets;
              return (
                <button
                  key={first.pet_id}
                  onClick={() => setViewer({ posts: g, i: 0 })}
                  className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
                >
                  <div
                    className={`rounded-full p-1 transition-transform group-hover:scale-105 ${
                      unseen
                        ? "bg-gradient-to-tr from-primary via-secondary to-accent shadow-md"
                        : "bg-border/80"
                    }`}
                  >
                    <img
                      src={pet?.photo_url ?? first.media_url}
                      alt={pet?.name ?? "Pet"}
                      className="h-18 w-18 rounded-full border-2 border-card object-cover sm:h-20 sm:w-20"
                    />
                  </div>
                  <span className="max-w-[80px] truncate text-center text-xs font-semibold text-foreground">
                    {pet?.name ?? "Amigo"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Barra de Filtros */}
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {(["Todos", ...CATS] as const).map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </FilterPill>
        ))}
      </div>

      {/* Grid Harmônico e Alinhado */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {feed.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-primary/30 bg-card p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-primary/40" />
            <p className="mt-3 text-lg font-semibold text-foreground">Nenhuma publicação nesta categoria.</p>
            <p className="mt-1 text-sm text-muted-foreground">Seja o primeiro a compartilhar uma novidade!</p>
          </div>
        )}

        {feed.map((f, idx) =>
          f.kind === "post" ? (
            /* Card de Final Feliz */
            <article
              key={f.post.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between border-b border-border/40 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={f.post.pets?.photo_url ?? f.post.media_url}
                      alt={f.post.pets?.name ?? "Pet"}
                      className="h-10 w-10 rounded-full border border-primary/20 object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-foreground">
                        {f.post.pets?.name ?? "Pet Adotado"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(f.post.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Final Feliz
                  </span>
                </div>

                {/* Foto / Mídia com Aspect Ratio Perfeito */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={f.post.media_url}
                    alt={f.post.caption ?? "Final feliz"}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Legenda / Depoimento */}
                <div className="p-4">
                  <p className="text-sm italic leading-relaxed text-foreground/90">
                    "{f.post.caption || "Vivendo uma nova vida com muito amor e carinho!"}"
                  </p>
                </div>
              </div>

              {/* Rodapé com Interações */}
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 text-xs text-muted-foreground">
                <button
                  onClick={() => toggleLike(f.post.id)}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    userLikes[f.post.id] ? "text-rose-600" : "hover:text-primary"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${userLikes[f.post.id] ? "fill-rose-600 text-rose-600" : ""}`}
                  />
                  <span>{(likes[f.post.id] ?? 8) + (userLikes[f.post.id] ? 1 : 0)} curtidas</span>
                </button>

                <button
                  onClick={() =>
                    handleSharePost(
                      `Final Feliz: ${f.post.pets?.name ?? "Pet"}`,
                      f.post.caption ?? "Confira esta linda história!",
                    )
                  }
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </article>
          ) : (
            /* Card de Artigo Educativo / ONG Parceira */
            <article
              key={f.a.title}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={f.a.photo}
                    alt={f.a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute left-3 top-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                        f.a.cat === "Dicas de Cuidados"
                          ? "bg-accent text-accent-foreground"
                          : "bg-sky text-sky-900"
                      }`}
                    >
                      {f.a.cat}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-5">
                  <h3 className="text-xl font-bold leading-snug text-foreground">
                    {f.a.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                    {f.a.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 px-5 py-3.5 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {f.a.readTime}
                </span>

                <button
                  onClick={() => setSelectedArticle(f.a)}
                  className="flex items-center gap-1 font-bold text-primary transition-colors hover:underline"
                >
                  <span>Ler artigo</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ),
        )}
      </div>

      {/* Modal / Dialog para Criar Publicação */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold italic text-primary">
              <Camera className="h-6 w-6 text-primary" />
              Compartilhe a novidade do seu pet
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={publish} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Pet Adotado
              </label>
              <select
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
                value={form.pet}
                onChange={(e) => setForm({ ...form, pet: e.target.value })}
                required
              >
                <option value="">Selecione o pet que você adotou</option>
                {adopted.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {adopted.length === 0 && (
                  <option value="seed-1">Mel (Adoção recente)</option>
                )}
              </select>
            </div>

            {/* Upload com Preview */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Foto ou Vídeo
              </label>
              {form.previewUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black/5">
                  <img
                    src={form.previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, file: null, previewUrl: null })}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-accent/30 p-6 text-center transition-colors hover:bg-accent/60">
                  <UploadCloud className="h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Clique para selecionar uma foto
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou MP4</p>
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
                Legenda / Como ele está?
              </label>
              <Textarea
                placeholder="Conte para a comunidade como tem sido a adaptação, brincadeiras e rotina com o pet..."
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Publicando..." : "Publicar no Mural"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Leitura Completa de Artigo */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      >
        <DialogContent className="max-w-xl rounded-2xl p-6">
          {selectedArticle && (
            <div className="space-y-4">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                <img
                  src={selectedArticle.photo}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow">
                  {selectedArticle.cat}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold leading-tight text-primary">
                  {selectedArticle.title}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                <p>{selectedArticle.content}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedArticle(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Story Player Fullscreen Modal */}
      {currentStory && viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewer(null)}
        >
          <div
            className="relative flex h-[85vh] w-full max-w-sm flex-col justify-between overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barras de Progresso dos Stories */}
            <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
              {viewer.posts.map((p, i) => (
                <div
                  key={p.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                >
                  <div
                    className={`h-full bg-white transition-all ${
                      i < viewer.i
                        ? "w-full"
                        : i === viewer.i
                          ? "animate-story"
                          : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Cabeçalho do Story */}
            <div className="absolute inset-x-3 top-6 z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 drop-shadow">
                <img
                  src={
                    currentStory.pets?.photo_url ?? currentStory.media_url
                  }
                  alt={currentStory.pets?.name ?? "Pet"}
                  className="h-8 w-8 rounded-full border border-white object-cover"
                />
                <span className="font-bold text-sm">
                  {currentStory.pets?.name ?? "Amigo Adotado"}
                </span>
              </div>
              <button
                onClick={() => setViewer(null)}
                aria-label="Fechar"
                className="rounded-full bg-black/40 p-1 text-white hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mídia do Story */}
            <div
              className="flex h-full w-full items-center justify-center"
              onClick={() =>
                setViewer((v) =>
                  v && v.i < v.posts.length - 1 ? { ...v, i: v.i + 1 } : null,
                )
              }
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
                <img
                  src={currentStory.media_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
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
      )}
    </div>
  );
}
