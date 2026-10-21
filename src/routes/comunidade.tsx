import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
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
  PawPrint,
  Copy,
  Check,
  ExternalLink,
  Award,
  Home,
  HeartHandshake,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilterPill } from "@/components/FilterPill";
import { RESGATADOS_UNB_PETS, SPIKE_PET, CHICO_PET, MARI_PET, NALA_PET } from "@/routes/adocao";

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

const CATS = ["Todos", "Nossos Parceiros", "Finais Felizes", "Dicas & Cuidados"] as const;
type Cat = (typeof CATS)[number];

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

/* ============================================================ */
/* INTERFACES E DADOS DOS PARCEIROS CERTIFICADOS                */
/* ============================================================ */
export interface PartnerOrg {
  id: string;
  name: string;
  category: "Projeto Universitário" | "ONG de Acolhimento" | "Coletivo Independente";
  region: string;
  leader: string;
  leaderRole: string;
  logo: string;
  coverGradient: string;
  badges: string[];
  summary: string;
  aboutStory: string;
  rescueMethodology: string;
  healthProtocols: {
    title: string;
    description: string;
  }[];
  adoptionRequirements: string[];
  pixKey: string;
  pixType: string;
  pixName: string;
  contactPhone?: string;
  instagramUrl?: string;
}

export const PARTNERS: PartnerOrg[] = [
  {
    id: "resgatados-unb",
    name: "Resgatados UnB",
    category: "Projeto Universitário",
    region: "Campus Darcy Ribeiro, Asa Norte — Brasília/DF",
    leader: "Bruna Miranda",
    leaderRole: "Gestora do Projeto • Voluntária da UnB",
    logo: "/resgatos-unb.png",
    coverGradient: "from-[#002f54] via-[#004f7a] to-[#0d6938]",
    badges: [
      "🎓 Projeto Universitário (UnB)",
      "🐾 Proteção Felina",
      "💉 FIV/FeLV Negativo",
      "✂️ Castração Garantida",
    ],
    summary:
      "Iniciativa universitária gerida por Bruna Miranda, dedicada ao acolhimento, saúde, controle sanitário e adoção responsável de felinos no campus Darcy Ribeiro.",
    aboutStory:
      "O projeto Resgatados UnB nasceu no campus Darcy Ribeiro da Universidade de Brasília com o objetivo de acolher, cuidar da saúde e encontrar lares seguros para os felinos que vivem no campus. Sob a coordenação de Bruna Miranda e voluntários dedicados da comunidade acadêmica, o projeto atua no controle ético populacional, garantindo atendimento veterinário completo, desparasitação, vacinação antirrábica, testes sorológicos contra FIV/FeLV e castração garantida antes de encaminhar cada felino para adoção responsável no Distrito Federal.",
    rescueMethodology:
      "Acolhimento criterioso no campus Darcy Ribeiro com quarentena supervisionada, vermifugação em duas etapas, testagem sorológica completa por imunocromatografia e adaptação comportamental continuada.",
    healthProtocols: [
      {
        title: "Testes Sorológicos FIV e FeLV",
        description:
          "100% dos animais resgatados são testados para Imunodeficiência e Leucemia Felina com laudo registrado.",
      },
      {
        title: "Vacinação Antirrábica & Polivalente (V4/V5)",
        description:
          "Protocolo completo de imunização com emissão da carteira de vacinação veterinária oficial.",
      },
      {
        title: "Castração Garantida e Obrigatória",
        description:
          "Animais adultos são entregues já castrados; filhotes contam com esterilização 100% custeada pelo projeto.",
      },
      {
        title: "Acompanhamento Pós-Adoção",
        description:
          "Suporte continuado nos primeiros 90 dias com a família para assegurar adaptação tranquila e enriquecimento ambiental.",
      },
    ],
    adoptionRequirements: [
      "Apartamento ou casa com 100% das janelas, vãos e sacadas com rede de proteção certificada.",
      "Vida estritamente indoor (sem rotas de fuga ou acesso desacompanhado à rua).",
      "Residência comprovada em Brasília/DF ou regiões administrativas adjacentes.",
      "Capacidade financeira para alimentação Super Premium e assistência veterinária periódica.",
      "Entrevista prévia e assinatura do Termo de Adoção Responsável com valor legal.",
    ],
    pixKey: "resgatadosunb@gmail.com",
    pixType: "Chave E-mail",
    pixName: "Projeto Resgatados UnB",
    instagramUrl: "https://instagram.com/",
  },
  {
    id: "lar-dos-bigodes",
    name: "Lar dos Bigodes",
    category: "ONG de Acolhimento",
    region: "Cruzeiro / Sudoeste — Brasília/DF",
    leader: "Coordenação de Voluntários",
    leaderRole: "Acolhimento e Reabilitação de Cães e Gatos",
    logo: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&q=80",
    coverGradient: "from-[#311042] via-[#521d6d] to-[#1e3a5f]",
    badges: [
      "🛡️ ONG Registrada",
      "🐾 Cães & Gatos",
      "💊 Reabilitação Ortopédica",
      "🏡 Lar Temporário",
    ],
    summary:
      "Associação de voluntários dedicada ao resgate, tratamento intensivo e encaminhamento afetuoso de animais vítimas de atropelamento e abandono no DF.",
    aboutStory:
      "Com anos de atuação no Distrito Federal, o Lar dos Bigodes mantém uma rede solidária de lares temporários supervisionados. O diferencial do projeto é o atendimento humanizado: animais resgatados com fraturas ou doenças crônicas recebem tratamento com especialistas ortopédicos, fisioterapia e alimentação terapêutica até que estejam 100% prontos para o convívio em família.",
    rescueMethodology:
      "Resgate com pronto-atendimento hospitalar, exames de imagem e sangue, hospedagem em lares temporários acolhedores para evitar o estresse do confinamento.",
    healthProtocols: [
      {
        title: "Triagem Laboratorial Completa",
        description:
          "Hemograma, pesquisa de hemoparasitas e avaliação de funções renal e hepática na admissão.",
      },
      {
        title: "Vacinas V8/V10 e Antirrábica",
        description:
          "Imunização completa realizada por clínicas conveniadas parceiras com registro em carteirinha.",
      },
      {
        title: "Esterilização e Microchip",
        description:
          "Todos os animais são castrados e recebem microchip de identificação para segurança do adotante.",
      },
      {
        title: "Suporte Fisioterápico",
        description:
          "Reabilitação pós-cirúrgica para animais resgatados com lesões e fraturas motoras.",
      },
    ],
    adoptionRequirements: [
      "Espaço seguro sem grades largas ou portões vazados com risco de fuga.",
      "Concordância explícita de todos os moradores da residência.",
      "Disponibilidade para entrevista de alinhamento com a equipe de voluntários.",
      "Manutenção de protocolo antipulgas, carrapaticidas e vermífugos periódicos.",
    ],
    pixKey: "contato@lardosbigodes.org.br",
    pixType: "Chave E-mail",
    pixName: "Associação Lar dos Bigodes",
    instagramUrl: "https://instagram.com/",
  },
  {
    id: "patinhas-do-gama",
    name: "Patinhas do Gama",
    category: "Coletivo Independente",
    region: "Gama & Entorno Sul — DF",
    leader: "Coletivo Protetores do Gama",
    leaderRole: "Ação Social e Controle Reprodutivo Comunitário",
    logo: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=400&q=80",
    coverGradient: "from-[#4c1d0a] via-[#832d12] to-[#b45309]",
    badges: [
      "🐾 Resgate de Rua",
      "🍲 Mutirões de Ração",
      "🚑 Socorro Emergencial",
      "❤️ Castração Solidária",
    ],
    summary:
      "Mobilização comunitária que resgata animais em vulnerabilidade extrema no Gama e Santa Maria, viabilizando castrações a baixo custo e feiras de adoção.",
    aboutStory:
      "O Patinhas do Gama nasceu da união de moradores e protetores independentes que vivenciam os desafios do abandono animal nas periferias do DF. Sem sede fixa ou financiamento estatal, o coletivo atua no socorro direto a fêmeas prenhas abandonadas, filhotes desamparados e cães feridos, organizando mutirões de castração e campanhas de arrecadação de ração.",
    rescueMethodology:
      "Ação comunitária ágil: resgate, socorro clínico em clínicas parceiras locais, acolhimento em rede de vizinhos protetores e divulgação ativa para adoção responsável.",
    healthProtocols: [
      {
        title: "Socorro e Estabilização Imediata",
        description:
          "Atendimento clínico emergencial para contenção de dores, ferimentos e hidratação.",
      },
      {
        title: "Desparasitação e Profilaxia",
        description: "Combate agressivo a pulgas, carrapatos, sarnas e verminoses intestinais.",
      },
      {
        title: "Castração Solidária Obrigatória",
        description:
          "Controle populacional intransigente: nenhum animal é entregue sem garantia de castração.",
      },
      {
        title: "Vacinação Básica Inicial",
        description: "Primeiras doses essenciais aplicadas antes da entrega à família definitiva.",
      },
    ],
    adoptionRequirements: [
      "Comprovante de residência no DF ou entorno.",
      "Compromisso formal de não manter o animal acorrentado ou isolado em quintais sem abrigo.",
      "Assinatura do Termo de Posse Responsável.",
      "Disponibilidade para compartilhar atualizações e fotos do pet.",
    ],
    pixKey: "patinhasdogama@gmail.com",
    pixType: "Chave E-mail",
    pixName: "Coletivo Patinhas do Gama",
    instagramUrl: "https://instagram.com/",
  },
  {
    id: "aumigos-do-quadradinho",
    name: "AuMigos do Quadradinho",
    category: "ONG de Acolhimento",
    region: "Distrito Federal (Conectando Famílias)",
    leader: "Equipe AuMigos",
    leaderRole: "Resgate e Adoção Responsável de Cães e Gatos",
    logo: "/pets/spike.jpg",
    coverGradient: "from-[#ea580c] via-[#c2410c] to-[#7c2d12]",
    badges: ["🐾 Conectando Famílias", "🐶 Cães & Gatos", "💉 Vacinados", "✂️ Castração Garantida"],
    summary:
      "Iniciativa solidária dedicada a acolher, reabilitar e conectar famílias a cães e gatos resgatados no Distrito Federal, com foco em posse responsável e socialização.",
    aboutStory:
      "O projeto AuMigos do Quadradinho atua em Brasília e regiões administrativas com foco no resgate humanizado, socialização e no encontro do par perfeito entre famílias amorosas e pets acolhidos. Cada animal acolhido, como o cãozinho Spike, passa por triagem veterinária completa: vacinação, vermifugação, castração e adaptação em ambiente acolhedor, convivendo em harmonia com outros cães, gatos e animais.",
    rescueMethodology:
      "Acolhimento humanizado em lares temporários parceiros supervisionados, com quarentena, reabilitação física e socialização cuidadosa para convivência pacífica com humanos e outros pets.",
    healthProtocols: [
      {
        title: "Imunização e Carteirinha Oficial",
        description: "Vacinação polivalente e antirrábica com acompanhamento clínico veterinário.",
      },
      {
        title: "Desparasitação e Profilaxia",
        description: "Protocolo completo contra vermes intestinais, pulgas e carrapatos.",
      },
      {
        title: "Castração Garantida e Obrigatória",
        description:
          "Todos os animais são entregues esterilizados para controle populacional ético no DF.",
      },
      {
        title: "Avaliação Comportamental e Socialização",
        description: "Triagem de convivência amigável com cães, gatos e outros animais domésticos.",
      },
    ],
    adoptionRequirements: [
      "Espaço seguro e compatível com o porte do pet (casas sem rotas de fuga ou apartamentos seguros).",
      "Concordância explícita de todos os moradores do domicílio.",
      "Capacidade para alimentação de qualidade e cuidados veterinários periódicos.",
      "Assinatura do Termo de Adoção Responsável com acompanhamento continuado.",
    ],
    pixKey: "aumigosdoquadradinho@gmail.com",
    pixType: "Chave E-mail",
    pixName: "AuMigos do Quadradinho DF",
    instagramUrl: "https://instagram.com/",
  },
];

/* ============================================================ */
/* ARTIGOS EDUCATIVOS DA COMUNIDADE                             */
/* ============================================================ */
type Article = {
  id: string;
  cat: "Dicas & Cuidados" | "Posse Responsável";
  title: string;
  summary: string;
  photo: string;
  readTime: string;
  content: string;
};

const ARTICLES: Article[] = [
  {
    id: "art-telas",
    cat: "Dicas & Cuidados",
    title: "Telas de proteção em janelas salvam vidas: Entenda a 'Síndrome do Gato Voador'",
    summary:
      "Por que janelas e sacadas teladas são exigência unânime de todas as ONGs sérias para adoção de felinos.",
    photo: img("photo-1514888286974-6c03e2ca1dba"),
    readTime: "3 min de leitura",
    content:
      "Gatos são caçadores ágeis, mas não possuem asas. Uma simples mosca, mariposa ou pássaro que passa na janela ativa o reflexo de bote instintivo do felino, fazendo com que ele se lance no vazio sem calcular a altura. As quedas de apartamentos (conhecidas na medicina veterinária como 'síndrome do gato voador') causam pneumotórax, fraturas mandibulares, ruptura de bexiga e muitas vezes a morte instantânea. Redes de proteção certificadas (em poliamida ou polietileno com nós resistentes), instaladas por profissionais qualificados em todas as janelas e vãos da residência, garantem que o animal viva com plenitude, ar fresco e segurança absoluta.",
  },
  {
    id: "art-vacinas",
    cat: "Dicas & Cuidados",
    title: "Carteirinha de vacinas em dia: O calendário básico de imunização para cães e gatos",
    summary:
      "Polivalente (V8/V10 ou V4/V5), antirrábica anual e desparasitação periódica salvam seu companheiro.",
    photo: img("photo-1583337130417-3346a1be7dee"),
    readTime: "4 min de leitura",
    content:
      "A vacinação é o maior ato preventivo de carinho pelo seu pet. Para cães, a vacina polivalente (V8 ou V10) protege contra cinomose, parvovirose, coronavirose, hepatite infecciosa e leptospirose. A vacina antirrábica é obrigatória por lei e protege contra a raiva, zoonose letal tanto para animais quanto para humanos. Para gatos, a vacina quádrupla (V4) ou quíntupla (V5) protege contra panleucopenia, rinotraqueíte, calicivirose e clamidiose. Mantenha os vermífugos e antipulgas/carrapatos rigorosamente atualizados com a orientação do veterinário de confiança.",
  },
  {
    id: "art-adaptacao",
    cat: "Posse Responsável",
    title: "A regra dos 3 dias, 3 semanas e 3 meses na adaptação de um animal resgatado",
    summary:
      "Como respeitar o tempo emocional do pet recém-chegado para construir um laço eterno de confiança.",
    photo: img("photo-1450778869180-41d0601e046e"),
    readTime: "3 min de leitura",
    content:
      "A adaptação de um animal resgatado segue uma curva biológica conhecida como a 'Regra 3-3-3': Nos primeiros 3 dias, o pet pode se sentir sobrecarregado, assustado, esconder-se embaixo de camas ou recusar alimento. É tempo de dar espaço e silêncio. Em 3 semanas, ele começa a relaxar, entender a rotina de alimentação e passeios, demonstrando sua verdadeira personalidade. Após 3 meses, o animal finalmente compreende que aquele é o seu lar definitivo, desenvolvendo um sentimento incondicional de segurança, vínculo familiar e lealdade.",
  },
  {
    id: "art-voluntariado",
    cat: "Posse Responsável",
    title: "Como apoiar a proteção animal no DF mesmo sem adotar um pet agora",
    summary:
      "Carona solidária (táxi pet), apadrinhamento de vacinas, doação de ração e lar temporário transformam vidas.",
    photo: img("photo-1601758228041-f3b2795255f1"),
    readTime: "3 min de leitura",
    content:
      "Se no momento você não dispõe de espaço ou rotina para adotar, ainda existem dezenas de formas vitais de salvar vidas. As ONGs de Brasília enfrentam escassez contínua de recursos básicos: transporte solidário para levar animais a consultas veterinárias, doações de rações Super Premium para animais convalescentes, produtos de higiene para abrigos e, acima de tudo, voluntários de Lar Temporário (LT) para acolher animais em recuperação pós-cirúrgica. Pequenos gestos regulares fazem toda a diferença para os protetores que estão na linha de frente.",
  },
];

/* ============================================================ */
/* INTERFACES DE POSTS DO DIÁRIO (MURAL REAL DA COMUNIDADE)      */
/* ============================================================ */
type Post = {
  id: string;
  pet_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  pets: { name: string; photo_url: string | null } | null;
};

type FeedItem = { kind: "post"; post: Post } | { kind: "article"; a: Article };

function ComunidadePage() {
  const { user, setAuthOpen } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [cat, setCat] = useState<Cat>("Todos");
  const [seen, setSeen] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{ posts: Post[]; i: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerOrg | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [partnerPixModal, setPartnerPixModal] = useState<PartnerOrg | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem("community-diary-seen") ?? "[]"));
      setLikes(JSON.parse(localStorage.getItem("community-post-likes") ?? "{}"));
      setUserLikes(JSON.parse(localStorage.getItem("community-user-likes") ?? "{}"));
    } catch {
      // Ignora erro de JSON
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

  const markSeen = (id: string) =>
    setSeen((s) => {
      if (s.includes(id)) return s;
      const n = [...s, id];
      localStorage.setItem("community-diary-seen", JSON.stringify(n));
      return n;
    });

  // Consulta de posts REAIS do banco de dados (sem nenhum mock pet)
  const { data: dbPosts = [] } = useQuery({
    queryKey: ["community-diary-real"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_posts")
        .select("*, pets(name, photo_url)")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data ?? []) as Post[];
    },
  });

  // Apenas posts reais da comunidade — nenhum pet fictício!
  const posts: Post[] = dbPosts;

  // Consulta de pets adotados cadastrados para o usuário escolher ao postar
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

  // Agrupamento dos posts reais para o carrossel de stories
  const groups = useMemo(() => {
    const m = new Map<string, Post[]>();
    posts.forEach((p) => m.set(p.pet_id, [...(m.get(p.pet_id) ?? []), p]));
    return [...m.values()];
  }, [posts]);

  // Feed dinâmico e equilibrado (posts reais + artigos educativos)
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
    if (cat === "Dicas & Cuidados") return out.filter((f) => f.kind === "article");
    return [];
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

  // Formulário para compartilhar história do pet adotado
  const [form, setForm] = useState<{
    pet: string;
    caption: string;
    file: File | null;
    previewUrl: string | null;
  }>({
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
      return toast.error("Por favor, selecione o pet adotado e envie uma foto ou vídeo.");
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
      toast.success("História publicada com sucesso no Mural!");
      setForm({ pet: "", caption: "", file: null, previewUrl: null });
      setShowShareModal(false);
      qc.invalidateQueries({ queryKey: ["community-diary-real"] });
    } catch {
      toast.error("Não foi possível publicar no momento. Tente novamente.");
    }
    setBusy(false);
  };

  const handleCopyPixKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedPix(true);
      toast.success("Chave PIX copiada para a área de transferência!");
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      toast.error("Não foi possível copiar a chave automaticamente.");
    }
  };

  const handleSharePartner = async (partner: PartnerOrg) => {
    const title = `${partner.name} — Parceiro Oficial Carita's Pets`;
    const text = `Conheça o trabalho de acolhimento e adoção responsável do ${partner.name} no Distrito Federal: ${partner.summary}`;
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
      toast.success("Link do parceiro copiado!");
    }
  };

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
      {/* ============================================================ */}
      {/* CABEÇALHO MODERNO DA COMUNIDADE                             */}
      {/* ============================================================ */}
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
              onClick={() => setCat("Nossos Parceiros")}
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

      {/* ============================================================ */}
      {/* CARROSSEL DE STORIES (SOMENTE POSTS REAIS DO BANCO)          */}
      {/* ============================================================ */}
      {groups.length > 0 && (
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
              onClick={() => (user ? setShowShareModal(true) : setAuthOpen(true))}
              className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/30 transition-all group-hover:border-primary group-hover:bg-secondary/60">
                <Plus className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Novo post</span>
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
      )}

      {/* ============================================================ */}
      {/* ABAS / FILTROS RÁPIDOS DA COMUNIDADE                         */}
      {/* ============================================================ */}
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {CATS.map((c) => (
          <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </FilterPill>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO MODERNA: PERFIL DOS NOSSOS PARCEIROS & ONGS            */}
      {/* ============================================================ */}
      {(cat === "Todos" || cat === "Nossos Parceiros") && (
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((partner) => (
              <div
                key={partner.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Topo do Card com Logo e Selo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted/40 p-1 shadow-xs">
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="h-full w-full rounded-xl object-contain"
                        />
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ring-2 ring-card">
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                      </div>
                      <div>
                        <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {partner.category}
                        </span>
                        <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {partner.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{partner.region.split("—")[0]}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Descrição resumida */}
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {partner.summary}
                  </p>

                  {/* Badges de Destaque */}
                  <div className="flex flex-wrap gap-1.5">
                    {partner.badges.slice(0, 3).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-lg bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botões de Ação do Parceiro */}
                <div className="mt-5 space-y-2 border-t border-border/40 pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPartnerPixModal(partner)}
                      className="rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-bold"
                    >
                      <HeartHandshake className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Apoiar PIX
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedPartner(partner)}
                      className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                    >
                      <span>Ver Perfil</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* GRID PRINCIPAL: MURAL DE FINAIS FELIZES & ARTIGOS EDUCATIVOS  */}
      {/* ============================================================ */}
      {cat !== "Nossos Parceiros" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>
                {cat === "Finais Felizes"
                  ? "Mural de Finais Felizes"
                  : cat === "Dicas & Cuidados"
                    ? "Guias & Artigos de Cuidados"
                    : `Mural da Comunidade (${feed.length})`}
              </span>
            </h2>
            {cat === "Finais Felizes" && (
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

          {feed.length === 0 ? (
            /* Estado Vazio Elegante e Acolhedor */
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
              {feed.map((f) =>
                f.kind === "post" ? (
                  /* Card Real de Post do Diário (Apenas pets reais adotados) */
                  <article
                    key={f.post.id}
                    className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
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
                          Final Feliz
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
                        <span>
                          {(likes[f.post.id] ?? 0) + (userLikes[f.post.id] ? 1 : 0)} curtidas
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          handleSharePost(
                            `Final Feliz: ${f.post.pets?.name ?? "Pet"}`,
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
                  /* Card de Artigo Educativo */
                  <article
                    key={f.a.id}
                    className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        <img
                          src={f.a.photo}
                          alt={f.a.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute left-3 top-3">
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-xs">
                            {f.a.cat}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4">
                        <h3 className="text-base font-bold leading-snug text-foreground">
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
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* MODAL MODERNO E COMPLETO: PERFIL DO PARCEIRO ESCOLHIDO        */}
      {/* ============================================================ */}
      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border border-primary/20">
          {selectedPartner && (
            <div>
              {/* Topo / Capa do Perfil com Gradiente Customizado */}
              <div
                className={`relative bg-gradient-to-r ${selectedPartner.coverGradient} p-6 sm:p-7 text-white overflow-hidden`}
              >
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-xl ring-2 ring-white/30 shrink-0">
                      <img
                        src={selectedPartner.logo}
                        alt={selectedPartner.name}
                        className="h-full w-full object-contain rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
                          {selectedPartner.category}
                        </span>
                        <span className="text-xs text-white/80 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {selectedPartner.region}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">{selectedPartner.name}</h2>
                      <p className="text-xs sm:text-sm text-white/90 font-medium">
                        {selectedPartner.leaderRole} • {selectedPartner.leader}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSharePartner(selectedPartner)}
                      className="rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-0 text-xs font-semibold"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Corpo do Modal em Abas / Navegação Interna Moderna */}
              <div className="p-6">
                <Tabs defaultValue="sobre" className="space-y-6">
                  <TabsList className="grid grid-cols-4 w-full rounded-2xl bg-muted/60 p-1">
                    <TabsTrigger value="sobre" className="rounded-xl text-xs font-bold">
                      Sobre
                    </TabsTrigger>
                    <TabsTrigger value="saude" className="rounded-xl text-xs font-bold">
                      Protocolos
                    </TabsTrigger>
                    <TabsTrigger value="adocao" className="rounded-xl text-xs font-bold">
                      Critérios
                    </TabsTrigger>
                    <TabsTrigger value="apoiar" className="rounded-xl text-xs font-bold">
                      Apoiar
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba 1: Sobre & História */}
                  <TabsContent value="sobre" className="space-y-5 pt-2">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        História e Propósito do Parceiro
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
                        "{selectedPartner.aboutStory}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Metodologia de Atuação
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {selectedPartner.rescueMethodology}
                      </p>
                    </div>

                    {/* Destaques Rápidos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {selectedPartner.badges.map((b) => (
                        <div
                          key={b}
                          className="flex items-center justify-center rounded-xl border border-border/80 bg-muted/30 p-2.5 text-center text-xs font-bold text-foreground"
                        >
                          {b}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Aba 2: Protocolos Veterinários */}
                  <TabsContent value="saude" className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-emerald-600" />
                        Padrões e Cuidados Veterinários Garantidos
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Todos os animais resgatados e tutelados por este parceiro recebem o seguinte
                        protocolo clínico:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {selectedPartner.healthProtocols.map((proto) => (
                        <div
                          key={proto.title}
                          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5"
                        >
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{proto.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {proto.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Aba 3: Critérios de Adoção e Ver Animais */}
                  <TabsContent value="adocao" className="space-y-5 pt-2">
                    {/* Gatinhos Reais da ONG Resgatados UnB */}
                    {selectedPartner.id === "resgatados-unb" && (
                      <div className="space-y-3 pb-3">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <PawPrint className="h-4 w-4 text-emerald-600" />
                              Gatinhos da ONG Resgatados UnB para Adoção (
                              {RESGATADOS_UNB_PETS.length})
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Animais sob tutela do projeto aguardando um lar seguro e amoroso no
                              DF.
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            Vacinados & Castração Garantida
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {RESGATADOS_UNB_PETS.map((pet) => (
                            <div
                              key={pet.id}
                              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-emerald-500/40 transition-colors"
                            >
                              <div className="space-y-2.5">
                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                                  <img
                                    src={pet.photo_url}
                                    alt={pet.name}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute top-2 left-2 flex gap-1">
                                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                      {pet.is_puppy ? "Filhote" : "Adulto"}
                                    </span>
                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                      {pet.gender === "femea" ? "Fêmea" : "Macho"}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-baseline justify-between">
                                    <h5 className="font-extrabold text-sm text-foreground">
                                      {pet.name}
                                    </h5>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      {pet.age_label}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {pet.description}
                                  </p>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPartner(null);
                                  navigate({ to: "/adocao" });
                                }}
                                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                              >
                                <Heart className="h-3.5 w-3.5 mr-1" /> Quero Adotar {pet.name}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cãozinho Real do AuMigos do Quadradinho */}
                    {selectedPartner.id === "aumigos-do-quadradinho" && (
                      <div className="space-y-3 pb-3">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <PawPrint className="h-4 w-4 text-primary" />
                              Cães do AuMigos do Quadradinho para Adoção (4)
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Animais sob tutela do projeto aguardando um lar seguro e amoroso no
                              DF.
                            </p>
                          </div>
                          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                            Vacinados, Vermifugados & Castrados
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {/* Spike */}
                          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-primary/40 transition-colors">
                            <div className="space-y-2.5">
                              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center">
                                <img
                                  src={SPIKE_PET.photo_url}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                                />
                                <img
                                  src={SPIKE_PET.photo_url}
                                  alt={SPIKE_PET.name}
                                  className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center"
                                />
                                <div className="absolute top-2 left-2 flex gap-1 z-20">
                                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                    1 ano
                                  </span>
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                    Macho · 9kg
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between">
                                  <h5 className="font-extrabold text-sm text-foreground">
                                    {SPIKE_PET.name}
                                  </h5>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {SPIKE_PET.age_label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {SPIKE_PET.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(null);
                                navigate({ to: "/adocao" });
                              }}
                              className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold"
                            >
                              <Heart className="h-3.5 w-3.5 mr-1 fill-current" /> Quero Adotar o
                              Spike
                            </Button>
                          </div>

                          {/* Chico */}
                          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-primary/40 transition-colors">
                            <div className="space-y-2.5">
                              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center">
                                <img
                                  src={CHICO_PET.photo_url}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                                />
                                <img
                                  src={CHICO_PET.photo_url}
                                  alt={CHICO_PET.name}
                                  className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center"
                                />
                                <div className="absolute top-2 left-2 flex gap-1 z-20">
                                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                    1 ano
                                  </span>
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                    Macho · 12,5kg
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between">
                                  <h5 className="font-extrabold text-sm text-foreground">
                                    {CHICO_PET.name}
                                  </h5>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {CHICO_PET.age_label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {CHICO_PET.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(null);
                                navigate({ to: "/adocao" });
                              }}
                              className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold"
                            >
                              <Heart className="h-3.5 w-3.5 mr-1 fill-current" /> Quero Adotar o
                              Chico
                            </Button>
                          </div>

                          {/* Mari */}
                          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-primary/40 transition-colors">
                            <div className="space-y-2.5">
                              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center">
                                <img
                                  src={MARI_PET.photo_url}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                                />
                                <img
                                  src={MARI_PET.photo_url}
                                  alt={MARI_PET.name}
                                  className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center"
                                />
                                <div className="absolute top-2 left-2 flex gap-1 z-20">
                                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                    1 ano e meio
                                  </span>
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                    Fêmea · 14kg
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between">
                                  <h5 className="font-extrabold text-sm text-foreground">
                                    {MARI_PET.name}
                                  </h5>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {MARI_PET.age_label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {MARI_PET.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(null);
                                navigate({ to: "/adocao" });
                              }}
                              className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold"
                            >
                              <Heart className="h-3.5 w-3.5 mr-1 fill-current" /> Quero Adotar a
                              Mari
                            </Button>
                          </div>

                          {/* Nala */}
                          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-primary/40 transition-colors">
                            <div className="space-y-2.5">
                              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center">
                                <img
                                  src={NALA_PET.photo_url}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                                />
                                <img
                                  src={NALA_PET.photo_url}
                                  alt={NALA_PET.name}
                                  className="relative z-10 max-h-full max-w-full h-full w-auto object-contain object-center"
                                />
                                <div className="absolute top-2 left-2 flex gap-1 z-20">
                                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                    1 ano
                                  </span>
                                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                    Fêmea · 16kg
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between">
                                  <h5 className="font-extrabold text-sm text-foreground">
                                    {NALA_PET.name}
                                  </h5>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {NALA_PET.age_label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {NALA_PET.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(null);
                                navigate({ to: "/adocao" });
                              }}
                              className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold"
                            >
                              <Heart className="h-3.5 w-3.5 mr-1 fill-current" /> Quero Adotar a
                              Nala
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Requisitos Obrigatórios para Adoção Responsável
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Exigências fundamentais para garantir a segurança, integridade e longevidade
                        dos pets adotados:
                      </p>
                    </div>

                    <div className="space-y-2">
                      {selectedPartner.adoptionRequirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-foreground/90 font-medium">
                            {req}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Quer ver os pets disponíveis?
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Consulte os animais para adoção responsável no catálogo oficial da
                          plataforma.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedPartner(null);
                          navigate({ to: "/adocao" });
                        }}
                        className="rounded-xl text-xs font-bold shrink-0"
                      >
                        <PawPrint className="h-3.5 w-3.5 mr-1.5" />
                        Ir para o Catálogo de Adoção
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Aba 4: Como Apoiar (PIX e Voluntariado) */}
                  <TabsContent value="apoiar" className="space-y-5 pt-2">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Doação Direta via PIX
                        </span>
                        <h4 className="text-lg font-black text-foreground">
                          Ajude a custear ração, vacinas e medicamentos
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          100% das contribuições são geridas com responsabilidade diretamente pelo
                          parceiro.
                        </p>
                      </div>

                      <div className="rounded-xl bg-card border border-border/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">
                            Chave Oficial ({selectedPartner.pixType}):
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyPixKey(selectedPartner.pixKey)}
                            className="h-7 px-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                          >
                            {copiedPix ? (
                              <Check className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 mr-1" />
                            )}
                            {copiedPix ? "Copiada!" : "Copiar Chave"}
                          </Button>
                        </div>
                        <p className="text-xs font-mono font-bold text-foreground break-all bg-muted/60 p-2 rounded-lg">
                          {selectedPartner.pixKey}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Favorecido:{" "}
                          <strong className="text-foreground">{selectedPartner.pixName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1">
                        <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5 text-primary" /> Lar Temporário (LT)
                        </h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ofereça abrigo transitório e carinho para animais em fase final de
                          recuperação pós-resgate.
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1">
                        <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-primary" /> Táxi Pet Voluntário
                        </h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ajude a transportar animais para consultas, castrações e feiras de adoção
                          em Brasília.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Rodapé do Modal */}
              <div className="border-t border-border/40 p-4 bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPartner(null);
                    navigate({ to: "/adocao" });
                  }}
                  className="text-xs font-semibold"
                >
                  Ver Catálogo de Adoção
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedPartner(null)}
                  className="text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL RÁPIDO DE DOAÇÃO PIX PARA O PARCEIRO                   */}
      {/* ============================================================ */}
      <Dialog open={!!partnerPixModal} onOpenChange={(open) => !open && setPartnerPixModal(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          {partnerPixModal && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <img
                  src={partnerPixModal.logo}
                  alt={partnerPixModal.name}
                  className="h-12 w-12 rounded-2xl border border-primary/20 object-contain p-1"
                />
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase">
                    Apoio Solidário
                  </span>
                  <h3 className="text-lg font-black text-foreground">{partnerPixModal.name}</h3>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    Chave PIX Oficial ({partnerPixModal.pixType}):
                  </span>
                  <p className="text-xs font-mono font-bold text-foreground break-all bg-card p-2 rounded-xl border border-border">
                    {partnerPixModal.pixKey}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Favorecido: <strong>{partnerPixModal.pixName}</strong>
                  </p>
                </div>

                <Button
                  onClick={() => handleCopyPixKey(partnerPixModal.pixKey)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  {copiedPix ? (
                    <Check className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {copiedPix ? "Chave Copiada com Sucesso!" : "Copiar Chave PIX"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Todo valor doado apoia diretamente a compra de ração, vacinas e cuidados
                emergenciais.
              </p>

              <Button
                variant="outline"
                onClick={() => setPartnerPixModal(null)}
                className="w-full rounded-xl text-xs"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL PARA LEITURA DE ARTIGO EDUCATIVO                       */}
      {/* ============================================================ */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          {selectedArticle && (
            <div className="space-y-4">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
                <img
                  src={selectedArticle.photo}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-xs">
                  {selectedArticle.cat}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold leading-tight text-foreground">
                  {selectedArticle.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed text-foreground">
                <p>{selectedArticle.content}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedArticle(null)}
                  className="rounded-xl text-xs"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL / DIALOG PARA COMPARTILHAR HISTÓRIA                    */}
      {/* ============================================================ */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Camera className="h-5 w-5 text-primary" />
              Compartilhe a novidade do seu pet adotado
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Publique fotos ou vídeos do dia a dia do seu pet para inspirar novas adoções
              responsáveis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={publish} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Pet Adotado
              </label>
              {adoptedPets.length > 0 ? (
                <select
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
                  value={form.pet}
                  onChange={(e) => setForm({ ...form, pet: e.target.value })}
                  required
                >
                  <option value="">Selecione o pet adotado</option>
                  {adoptedPets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Cadastre ou conclua a adoção de um pet para vinculá-lo à publicação. Se você é um
                  tutor recente, selecione o pet adotado no sistema.
                </div>
              )}
            </div>

            {/* Upload com Preview */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Foto ou Vídeo
              </label>
              {form.previewUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black/5">
                  <img src={form.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, file: null, previewUrl: null })}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-colors hover:bg-primary/10">
                  <UploadCloud className="h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Clique para selecionar uma foto ou vídeo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Metadados EXIF/GPS são removidos automaticamente por segurança.
                  </p>
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
                Como ele está? (Legenda)
              </label>
              <Textarea
                placeholder="Conte para a comunidade como tem sido a adaptação, brincadeiras e a rotina do pet..."
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy} className="rounded-xl text-xs font-bold">
                {busy ? "Publicando..." : "Publicar no Mural"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* STORY PLAYER FULLSCREEN MODAL                                */}
      {/* ============================================================ */}
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
              className="flex h-full w-full items-center justify-center cursor-pointer"
              onClick={() =>
                setViewer((v) => (v && v.i < v.posts.length - 1 ? { ...v, i: v.i + 1 } : null))
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
      )}
    </div>
  );
}
