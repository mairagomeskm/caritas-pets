import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  GraduationCap,
  ShieldCheck,
  MapPin,
  Syringe,
  Stethoscope,
  ArrowRight,
  HeartHandshake,
  PawPrint,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterPill } from "@/components/FilterPill";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade & Resgatos UnB — Carita's Pets" },
      {
        name: "description",
        content:
          "Mural da comunidade Carita's Pets: projeto parceiro Resgatos UnB por Bruna Miranda, histórias de finais felizes e dicas de cuidados.",
      },
      { property: "og:title", content: "Comunidade Carita's & Resgatos UnB" },
      {
        property: "og:description",
        content:
          "Conheça o projeto Resgatos UnB, veja os gatinhos para adoção responsável e acompanhe depoimentos emocionantes.",
      },
    ],
  }),
  component: ComunidadePage,
});

const CATS = ["Todos", "Projetos & ONGs", "Finais Felizes", "Dicas de Cuidados"] as const;
type Cat = (typeof CATS)[number];

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

type Article = {
  cat: "Conheça nossas ONGs parceiras" | "Dicas de Cuidados";
  title: string;
  summary: string;
  photo: string;
  readTime: string;
  content: string;
  isResgatos?: boolean;
};

const ARTICLES: Article[] = [
  {
    cat: "Conheça nossas ONGs parceiras",
    title: "Resgatos UnB: Cuidados, Ciência e Adoção Responsável no Campus Darcy Ribeiro",
    summary:
      "Gerido por Bruna Miranda, estudante de Farmácia, o projeto cuida da saúde e busca lares seguros para cerca de 50 gatos da Universidade de Brasília.",
    photo: "/resgatos-unb.png",
    readTime: "3 min de leitura",
    isResgatos: true,
    content:
      "A Universidade de Brasília (UnB) tem um projeto chamado Resgatos UnB, que visa a adoção responsável dos gatos que vivem no campus. O projeto, gerido pela estudante de Farmácia Bruna Miranda, busca garantir as melhores condições de saúde e vida para os animais, além de encontrar lares para cerca de 50 gatos encontrados. O processo de resgate e adoção é complexo, envolvendo cuidados médicos, vacinação e acompanhamento pós-adoção para garantir a adaptação dos gatos aos novos lares. No campus Darcy Ribeiro, cada resgate segue rígidos protocolos sanitários, vermifugação, testes de FIV e FeLV, castração e acompanhamento afetuoso até que cada felino encontre sua família definitiva.",
  },
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
    id: "sample-resgatos-1",
    pet_id: "seed-violeta",
    media_url: "/pets/violeta.jpg",
    media_type: "image",
    caption:
      "Violeta pronta para encher um novo lar de alegria! Vacinada contra a raiva, vermifugada e com castração 100% garantida pelo projeto Resgatos UnB da Bruna Miranda 💚",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    pets: { name: "Violeta (Resgatos UnB)", photo_url: "/pets/violeta.jpg" },
  },
  {
    id: "sample-resgatos-2",
    pet_id: "seed-ana",
    media_url: "/pets/ana.jpg",
    media_type: "image",
    caption:
      "A linda mãezinha Ana passou pelo protocolo sanitário completo da UnB, está castrada, vacinada e aguarda um lar bem seguro e carinhoso!",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    pets: { name: "Ana (Resgatos UnB)", photo_url: "/pets/ana.jpg" },
  },
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

type BrunaPet = {
  id: string;
  name: string;
  gender: "Fêmea" | "Macho";
  age: string;
  category: string;
  photo: string;
  tags: string[];
  summary: string;
  detailedStory: string;
  healthChecks: string[];
};

const BRUNA_PETS: BrunaPet[] = [
  {
    id: "seed-violeta",
    name: "Violeta",
    gender: "Fêmea",
    age: "6 meses",
    category: "Filhote",
    photo: "/pets/violeta.jpg",
    tags: ["Filhote", "Vacinada (Antirrábica)", "Mãe FIV/FeLV -", "Castração Garantida"],
    summary: "Charmosa, dócil e expressiva com lacinho vermelho. Vermifugada, vacinada e castração garantida.",
    detailedStory:
      "A Violeta é uma gatinha encantadora, dócil e cheia de charme de 6 meses. Com sua pose charmosa e sua carinha expressiva com lacinho vermelho, conquista qualquer pessoa! Ela é filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: já está vermifugada, vacinada contra raiva (antirrábica) e a castração está 100% garantida pelo projeto Resgatos UnB. É super carinhosa, sociável, brincalhona e usa a caixinha de areia com perfeição. Procura uma família amorosa e responsável no DF para encher o lar de alegria.",
    healthChecks: [
      "Vacinada contra a Raiva (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida pelo projeto Resgatos UnB",
    ],
  },
  {
    id: "seed-higor",
    name: "Higor",
    gender: "Macho",
    age: "6 meses",
    category: "Filhote",
    photo: "/pets/higor.jpg",
    tags: ["Filhote", "Vacinado (Antirrábica)", "Mãe FIV/FeLV -", "Castração Garantida"],
    summary: "Gatinho tigrado com peito branquinho, olhar doce, calmo e muito carinhoso. Castração garantida.",
    detailedStory:
      "O Higor é um gatinho tigrado com peito branquinho, olhar doce e muito carinhoso de 6 meses. Ele e a Violeta são do projeto Resgatos UnB. Muito tranquilo e amoroso, ele adora aconchegar-se em mantinhas quentinhas e receber carinho atrás das orelhas. É filho de mamãe testada negativa para FIV e FeLV. Seu protocolo veterinário está rigorosamente em dia: vermifugado, vacinado contra a raiva (antirrábica) e a castração está 100% garantida pelo projeto. Usa caixinha de areia com perfeição e busca um lar responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    healthChecks: [
      "Vacinado contra a Raiva (Antirrábica)",
      "Vermifugado com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida pelo projeto Resgatos UnB",
    ],
  },
  {
    id: "seed-rosa",
    name: "Rosa",
    gender: "Fêmea",
    age: "6 meses",
    category: "Filhote",
    photo: "/pets/rosa.jpg",
    tags: ["Filhote", "Vacinada (Antirrábica)", "Mãe FIV/FeLV -", "Castração Garantida"],
    summary: "Elegante e meiga com lacinho listrado, carinhosa, expressiva, vermifugada e vacinada.",
    detailedStory:
      "A Rosa é uma gatinha linda e graciosa de 6 meses, resgatada junto com seus irmãozinhos pelo projeto Resgatos UnB. Muito carinhosa, expressiva e vaidosa, adora receber carinho e posar elegante com seu lacinho listrado. É filha de mamãe com teste negativo para FIV e FeLV. Seu protocolo veterinário está rigorosamente completo: já está vermifugada, vacinada contra raiva (antirrábica) e possui castração 100% garantida pelo projeto. É super asseada, brincalhona e usa a caixinha de areia com perfeição. Busca uma família responsável em Brasília/DF (apartamento telado ou casa segura) para encher a vida de amor.",
    healthChecks: [
      "Vacinada contra a Raiva (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Mãe testada negativa para FIV e FeLV",
      "Castração 100% garantida pelo projeto Resgatos UnB",
    ],
  },
  {
    id: "seed-ana",
    name: "Ana (Mãezinha)",
    gender: "Fêmea",
    age: "1 a 2 anos",
    category: "Adulta",
    photo: "/pets/ana.jpg",
    tags: ["Adulta", "Já Castrada", "Vacinada (Antirrábica)", "FIV/FeLV Negativa"],
    summary: "Mãezinha dos filhotes, extremamente dócil e amorosa de olhos verdes. Já castrada e vacinada.",
    detailedStory:
      "A Ana é a heroica e doce mãezinha de Violeta, Higor e Rosa, resgatada com toda a sua ninhada pelo projeto Resgatos UnB. Jovem (entre 1 e 2 anos), ela cuidou exemplarmente de todos os seus filhotes e agora merece um lar repleto de carinho e tranquilidade. Com seus olhos verdes encantadores e um charmoso laço de florzinhas amarelas, é super mansa, adora ficar deitada em mantas macias e receber cafuné. Seu protocolo veterinário está 100% completo: castrada, vacinada contra a raiva (antirrábica), vermifugada e testada negativa para FIV e FeLV. Muito limpinha e asseada com sua caixinha de areia. Espera por uma adoção amorosa e responsável em Brasília/DF (apartamento telado ou casa sem rotas de fuga).",
    healthChecks: [
      "Já Castrada com recuperação perfeita",
      "Vacinada contra a Raiva (Antirrábica)",
      "Vermifugada com protocolo completo",
      "Testada 100% negativa para FIV e FeLV",
    ],
  },
];

type FeedItem = { kind: "post"; post: Post } | { kind: "article"; a: Article };

function ComunidadePage() {
  const { user, setAuthOpen } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [cat, setCat] = useState<Cat>("Todos");
  const [seen, setSeen] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{ posts: Post[]; i: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"sobre" | "gatos">("sobre");
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

  // Agrupamento dos posts para o carrossel de stories
  const groups = useMemo(() => {
    const m = new Map<string, Post[]>();
    posts.forEach((p) => m.set(p.pet_id, [...(m.get(p.pet_id) ?? []), p]));
    return [...m.values()];
  }, [posts]);

  // Feed equilibrado e filtrado
  const feed = useMemo(() => {
    const ps: FeedItem[] = [...posts].map((post) => ({ kind: "post", post }));
    const as: FeedItem[] = ARTICLES.map((a) => ({ kind: "article", a }));
    const out: FeedItem[] = [];

    while (ps.length || as.length) {
      if (ps.length) out.push(ps.shift()!);
      if (ps.length) out.push(ps.shift()!);
      if (as.length) out.push(as.shift()!);
    }

    if (cat === "Todos") return out;
    if (cat === "Finais Felizes") return out.filter((f) => f.kind === "post");
    if (cat === "Projetos & ONGs") {
      return out.filter(
        (f) =>
          (f.kind === "article" && f.a.cat === "Conheça nossas ONGs parceiras") ||
          (f.kind === "post" && (f.post.id.includes("resgatos") || f.post.caption?.includes("UnB"))),
      );
    }
    return out.filter((f) => f.kind === "article" && f.a.cat === "Dicas de Cuidados");
  }, [posts, cat]);

  // Visualizador automático de stories
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
      toast.success("História publicada com sucesso!");
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

  const handleShareBrunaProfile = async () => {
    const title = "Projeto Resgatos UnB — Bruna Miranda";
    const text =
      "Conheça o projeto Resgatos UnB liderado por Bruna Miranda na Universidade de Brasília: acolhimento, cuidados de saúde e adoção responsável de gatos!";
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
      toast.success("Link do perfil copiado!");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho Limpo e Objetivo */}
      <header className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 text-primary">
                <Users className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mural Público & Parceiros
              </span>
            </div>
            <h1 className="text-2xl font-extrabold italic tracking-tight text-primary sm:text-3xl">
              Comunidade Carita's
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhe novidades de pets adotados, iniciativas parceiras e orientações de posse responsável.
            </p>
          </div>

          <Button
            onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 shadow-xs transition-all hover:scale-105 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Compartilhar Novidade</span>
          </Button>
        </div>
      </header>

      {/* Carrossel de Stories Limpo */}
      {groups.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Stories & Atualizações Recentes
            </h2>
            <span className="text-xs text-muted-foreground">Toque para ver</span>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 py-1.5">
            {/* Adicionar Story */}
            <button
              onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
              className="group flex shrink-0 flex-col items-center gap-1 focus:outline-none"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-secondary/20 transition-all group-hover:border-primary group-hover:bg-secondary/50">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-foreground">Novo post</span>
            </button>

            {groups.map((g) => {
              const unseen = g.some((p) => !seen.includes(p.id));
              const first = g[0]!;
              const pet = first.pets;
              return (
                <button
                  key={first.pet_id}
                  onClick={() => setViewer({ posts: g, i: 0 })}
                  className="group flex shrink-0 flex-col items-center gap-1 focus:outline-none"
                >
                  <div
                    className={`rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                      unseen
                        ? "bg-gradient-to-tr from-emerald-600 via-primary to-accent shadow-xs"
                        : "bg-border/80"
                    }`}
                  >
                    <img
                      src={pet?.photo_url ?? first.media_url}
                      alt={pet?.name ?? "Pet"}
                      className="h-16 w-16 rounded-full border-2 border-card object-cover"
                    />
                  </div>
                  <span className="max-w-[75px] truncate text-center text-[11px] font-semibold text-foreground">
                    {pet?.name ?? "Amigo"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Pílulas de Filtro Rápidas */}
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {CATS.map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </FilterPill>
        ))}
      </div>

      {/* ============================================================ */}
      {/* CARD DO PERFIL RESGATOS UNB (CLIQUE PARA VER AS INFORMAÇÕES) */}
      {/* ============================================================ */}
      {(cat === "Todos" || cat === "Projetos & ONGs") && (
        <section
          onClick={() => {
            setActiveProfileTab("sobre");
            setShowProfileModal(true);
          }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-xs transition-all duration-300 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Redonda com Selo */}
              <div className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl border-2 border-emerald-500/20 bg-white p-2 shadow-xs shrink-0">
                <img
                  src="/resgatos-unb.png"
                  alt="Resgatos UnB"
                  className="h-full w-full object-contain rounded-xl"
                />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ring-2 ring-card">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Informações Resumidas */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Projeto Parceiro Oficial
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" /> UnB Darcy Ribeiro
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
                  Projeto Resgatos UnB — Bruna Miranda
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  Adoção responsável e cuidados de saúde felina no campus da Universidade de Brasília.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 font-semibold text-primary">
                    <PawPrint className="h-3 w-3" /> 4 gatos para adoção
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                    <GraduationCap className="h-3 w-3" /> Farmácia UnB
                  </span>
                </div>
              </div>
            </div>

            {/* Botão de Ação / Clique */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="outline"
                className="rounded-full border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 group-hover:border-emerald-600 flex items-center gap-1.5 font-semibold text-xs sm:text-sm"
              >
                <span>Ver Informações & Gatos</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Grid Principal do Mural (Posts e Artigos) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Publicações da Comunidade ({feed.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {feed.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-primary/30 bg-card p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-primary/40" />
              <p className="mt-3 text-base font-semibold text-foreground">Nenhuma publicação nesta categoria.</p>
              <p className="mt-1 text-xs text-muted-foreground">Explore outras opções no topo.</p>
            </div>
          )}

          {feed.map((f) =>
            f.kind === "post" ? (
              /* Card de Post do Mural */
              <article
                key={f.post.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border/40 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={f.post.pets?.photo_url ?? f.post.media_url}
                        alt={f.post.pets?.name ?? "Pet"}
                        className="h-9 w-9 rounded-full border border-primary/20 object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {f.post.pets?.name ?? "Pet Adotado"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(f.post.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {f.post.caption?.includes("UnB") ? "Resgatos UnB" : "Final Feliz"}
                    </span>
                  </div>

                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={f.post.media_url}
                      alt={f.post.caption ?? "Final feliz"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  <div className="p-3.5">
                    <p className="text-xs sm:text-sm italic leading-relaxed text-foreground/90">
                      "{f.post.caption || "Vivendo uma nova vida com muito amor e carinho!"}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 px-3.5 py-2.5 text-xs text-muted-foreground">
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
                        `Publicação: ${f.post.pets?.name ?? "Pet"}`,
                        f.post.caption ?? "Confira esta história no Carita's Pets!",
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
              /* Card de Artigo Educativo ou ONG */
              <article
                key={f.a.title}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={f.a.photo}
                      alt={f.a.title}
                      loading="lazy"
                      className={`h-full w-full transition-transform duration-500 hover:scale-105 ${
                        f.a.isResgatos ? "object-contain bg-white p-5" : "object-cover"
                      }`}
                    />
                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold shadow-xs ${
                          f.a.cat === "Dicas de Cuidados"
                            ? "bg-accent text-accent-foreground"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {f.a.isResgatos ? "Resgatos UnB" : f.a.cat}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-4">
                    <h3 className="text-base sm:text-lg font-bold leading-snug text-foreground">
                      {f.a.title}
                    </h3>
                    <p className="line-clamp-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {f.a.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 px-4 py-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {f.a.readTime}
                  </span>

                  <button
                    onClick={() => {
                      if (f.a.isResgatos) {
                        setActiveProfileTab("sobre");
                        setShowProfileModal(true);
                      } else {
                        setSelectedArticle(f.a);
                      }
                    }}
                    className="flex items-center gap-1 font-bold text-primary transition-colors hover:underline"
                  >
                    <span>{f.a.isResgatos ? "Ver Perfil & Gatos" : "Ler artigo"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL COMPLETO: PERFIL & INFORMAÇÕES RESGATOS UNB            */}
      {/* ============================================================ */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border border-emerald-500/30">
          {/* Topo / Capa do Perfil */}
          <div className="relative bg-gradient-to-r from-[#002f54] via-[#004f7a] to-[#0d6938] p-6 text-white overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-lg ring-2 ring-emerald-400/40 shrink-0">
                  <img
                    src="/resgatos-unb.png"
                    alt="Logo Resgatos UnB"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
                      🎓 Projeto UnB
                    </span>
                    <span className="text-xs text-emerald-200">Campus Darcy Ribeiro</span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">Bruna Miranda</h3>
                  <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                    Gestora do Projeto Resgatos UnB • Estudante de Farmácia (UnB)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShareBrunaProfile}
                  className="rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-0 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                </Button>
              </div>
            </div>
          </div>

          {/* Abas Internas do Modal: Sobre o Projeto e Gatinhos */}
          <div className="border-b border-border/50 bg-muted/20 px-6 pt-3 flex gap-4">
            <button
              onClick={() => setActiveProfileTab("sobre")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeProfileTab === "sobre"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Sobre o Projeto</span>
            </button>

            <button
              onClick={() => setActiveProfileTab("gatos")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeProfileTab === "gatos"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <PawPrint className="h-4 w-4" />
              <span>Gatinhos para Adoção ({BRUNA_PETS.length})</span>
            </button>
          </div>

          {/* Corpo do Modal */}
          <div className="p-6 space-y-6">
            {activeProfileTab === "sobre" ? (
              <div className="space-y-6">
                {/* Descrição enviada pelo usuário */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-foreground">
                        Descrição Oficial do Projeto
                      </h4>
                      <p className="text-sm sm:text-base leading-relaxed text-foreground/95 italic">
                        "A Universidade de Brasília (UnB) tem um projeto chamado Resgatos UnB, que visa a adoção responsável dos gatos que vivem no campus. O projeto, gerido pela estudante de Farmácia Bruna Miranda, busca garantir as melhores condições de saúde e vida para os animais, além de encontrar lares para cerca de 50 gatos encontrados. O processo de resgate e adoção é complexo, envolvendo cuidados médicos, vacinação e acompanhamento pós-adoção para garantir a adaptação dos gatos aos novos lares."
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4 Pontos Chave */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <Users className="h-4 w-4" />
                      <span>~50 Gatos no Campus</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Monitoramento diário e assistência à população felina do campus Darcy Ribeiro.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <Stethoscope className="h-4 w-4" />
                      <span>Gestão em Farmácia</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Triagem de saúde, desparasitação e medicamentos geridos pela estudante Bruna Miranda.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <Syringe className="h-4 w-4" />
                      <span>Protocolo Sanitário Completo</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Vacinação antirrábica, testes FIV/FeLV e castração garantida para todos os resgatados.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Acompanhamento Pós-Adoção</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Verificação de segurança (telas) e acompanhamento próximo para a perfeita adaptação familiar.
                    </p>
                  </div>
                </div>

                {/* Chamada para ver os gatinhos */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-secondary/40 p-4 border border-border/60">
                  <div className="text-xs sm:text-sm text-foreground">
                    <span className="font-bold">Quer conhecer os gatinhos prontos para adoção?</span>
                    <p className="text-xs text-muted-foreground">Violeta, Higor, Rosa e a mãezinha Ana estão aguardando um lar!</p>
                  </div>
                  <Button
                    onClick={() => setActiveProfileTab("gatos")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold"
                  >
                    Ver Gatos para Adoção
                  </Button>
                </div>
              </div>
            ) : (
              /* Aba: Gatinhos para Adoção */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Gatinhos resgatados pela equipe da UnB com protocolos de vacinação, exames e castração.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {BRUNA_PETS.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                          <img
                            src={pet.photo}
                            alt={pet.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex gap-1">
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                              {pet.category}
                            </span>
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {pet.gender}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between">
                            <h5 className="font-extrabold text-base text-foreground">{pet.name}</h5>
                            <span className="text-xs font-semibold text-muted-foreground">{pet.age}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {pet.summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {pet.tags.slice(1, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-primary"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setShowProfileModal(false);
                          navigate({ to: "/adocao" });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                      >
                        <Heart className="h-3.5 w-3.5 mr-1" /> Quero Adotar {pet.name}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do Modal */}
          <div className="border-t border-border/40 p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowProfileModal(false);
                navigate({ to: "/adocao" });
              }}
              className="text-xs"
            >
              Ir para Catálogo de Adoção
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setShowProfileModal(false)}
              className="text-xs"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Artigos Educativos */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      >
        <DialogContent className="max-w-xl rounded-2xl p-6">
          {selectedArticle && (
            <div className="space-y-4">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
                <img
                  src={selectedArticle.photo}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-xs">
                  {selectedArticle.cat}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold leading-tight text-primary">
                  {selectedArticle.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed text-foreground">
                <p>{selectedArticle.content}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal / Dialog para Criar Publicação */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold italic text-primary">
              <Camera className="h-5 w-5 text-primary" />
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
                  <option value="seed-violeta">Violeta (Resgatos UnB)</option>
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
                placeholder="Conte para a comunidade como tem sido a rotina e adaptação com o pet..."
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
