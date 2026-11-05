import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Sparkles, Heart, Plus, Calendar, User, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { stripExifInBrowser } from "@/lib/exif-sanitizer";
import { QUINDIM_MEMORIAL, INITIAL_MEMORIAL_PETS } from "@/data/memorial";
import type { MemorialPet } from "@/types/pet";

const STORAGE_KEY = "caritas_memorial_pets_v2";
const LIKED_PETS_KEY = "caritas_memorial_liked_v2";

export const Route = createFileRoute("/saudades")({
  head: () => ({
    meta: [
      { title: "Cantinho da Saudade — Memorial de Amor | Carita's Pets DF" },
      {
        name: "description",
        content:
          "Um memorial de carinho para homenagear e guardar para sempre os pets que viraram estrelinhas.",
      },
    ],
  }),
  component: MemorialPage,
});

function MemorialPage() {
  const [pets, setPets] = useState<MemorialPet[]>(INITIAL_MEMORIAL_PETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Form State
  const [petName, setPetName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [tributePeriod, setTributePeriod] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [story, setStory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load liked tracking from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIKED_PETS_KEY);
      if (stored) {
        setLikedMap(JSON.parse(stored));
      }
    } catch {
      // Ignora erro de JSON local
    }
  }, []);

  // Fetch memorial pets with fallback
  useEffect(() => {
    let isMounted = true;

    async function loadPets() {
      // 1. Carrega dados do localStorage expurgando quaisquer mocks antigos
      const MOCK_PET_IDS = new Set(["memorial-belinha", "memorial-thor"]);
      let localPets: MemorialPet[] = [];
      try {
        // Tenta chave v2 primeiro, ou limpa da v1
        const stored =
          localStorage.getItem(STORAGE_KEY) || localStorage.getItem("caritas_memorial_pets_v1");
        if (stored) {
          const parsed = JSON.parse(stored) as MemorialPet[];
          localPets = parsed.filter(
            (p) => !MOCK_PET_IDS.has(p.id) && p.name !== "Belinha" && p.name !== "Thor",
          );
        }
      } catch {
        localPets = [];
      }

      // Base contendo exclusivamente o Quindim
      const baseMap = new Map<string, MemorialPet>();
      INITIAL_MEMORIAL_PETS.forEach((p) => baseMap.set(p.id, p));
      localPets.forEach((p) => {
        if (!MOCK_PET_IDS.has(p.id) && p.name !== "Belinha" && p.name !== "Thor") {
          baseMap.set(p.id, p);
        }
      });

      // 2. Tenta buscar do Supabase (tambem ignorando eventuais mocks residuais)
      try {
        const { data, error } = await supabase
          .from("memorial_pets" as never)
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && data && (data as unknown as MemorialPet[]).length > 0) {
          (data as unknown as MemorialPet[]).forEach((p: MemorialPet) => {
            if (!MOCK_PET_IDS.has(p.id) && p.name !== "Belinha" && p.name !== "Thor") {
              baseMap.set(p.id, {
                ...p,
                is_pinned: p.id === QUINDIM_MEMORIAL.id || p.is_pinned,
              });
            }
          });
        }
      } catch {
        // Fallback transparente para o armazenamento local caso a tabela remota nao exista
      }

      if (isMounted) {
        const list = Array.from(baseMap.values());
        // Garante que o Quindim seja o primeiro
        list.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
        setPets(list);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {
          // Ignora erro
        }
      }
    }

    loadPets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Separa o Quindim e os pets da comunidade
  const { pinnedPet, communityPets } = useMemo(() => {
    const pinned = pets.find((p) => p.is_pinned) || QUINDIM_MEMORIAL;
    const community = pets.filter((p) => p.id !== pinned.id);
    return { pinnedPet: pinned, communityPets: community };
  }, [pets]);

  // Handler para enviar carinho / estrelinha
  const handleSendLove = async (petId: string) => {
    const alreadyLiked = likedMap[petId];
    const delta = alreadyLiked ? -1 : 1;

    // Atualiza estado local imediatamente
    const newLiked = { ...likedMap, [petId]: !alreadyLiked };
    setLikedMap(newLiked);
    try {
      localStorage.setItem(LIKED_PETS_KEY, JSON.stringify(newLiked));
    } catch {
      // Ignora erro de storage
    }

    setPets((prev) => {
      const updated = prev.map((p) => {
        if (p.id === petId) {
          return { ...p, likes_count: Math.max(0, p.likes_count + delta) };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignora erro de storage
      }
      return updated;
    });

    if (!alreadyLiked) {
      toast.success("Uma estrelinha de amor foi acesa! ✨💛");
    }

    // Tenta atualizar no Supabase em segundo plano
    try {
      await supabase.rpc("increment_memorial_tribute", {
        target_pet_id: petId,
      });
    } catch {
      // Se RPC nao estiver configurada, tenta update direto
      try {
        const current = pets.find((p) => p.id === petId);
        if (current) {
          await (
            supabase.from("memorial_pets" as never) as unknown as {
              update: (vals: Record<string, unknown>) => {
                eq: (col: string, val: unknown) => Promise<unknown>;
              };
            }
          )
            .update({ likes_count: Math.max(0, current.likes_count + delta) })
            .eq("id", petId);
        }
      } catch {
        // Fallback local ja gravado
      }
    }
  };

  // Upload e otimizacao de foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sanitized = await stripExifInBrowser(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(sanitized);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Criar nova homenagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!petName.trim()) {
      toast.error("Por favor, informe o nome do pet.");
      return;
    }
    if (!story.trim()) {
      toast.error("Por favor, conte um pouco da historia ou deixe uma mensagem.");
      return;
    }

    setSubmitting(true);

    const newPet: MemorialPet = {
      id: `local-memorial-${Date.now()}`,
      name: petName.trim(),
      photo_url: photoUrl.trim() || "/mascot.jpg",
      tribute_period: tributePeriod.trim(),
      guardian_name: guardianName.trim(),
      story: story.trim(),
      likes_count: 1,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    // 1. Salva no estado e no localStorage
    setPets((prev) => {
      const updated = [newPet, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignora erro
      }
      return updated;
    });

    // 2. Tenta salvar no Supabase
    try {
      const { data: session } = await supabase.auth.getSession();
      await (
        supabase.from("memorial_pets" as never) as unknown as {
          insert: (row: Record<string, unknown>) => Promise<unknown>;
        }
      ).insert({
        name: newPet.name,
        photo_url: newPet.photo_url,
        tribute_period: newPet.tribute_period,
        guardian_name: newPet.guardian_name,
        story: newPet.story,
        likes_count: 1,
        is_pinned: false,
        user_id: session?.session?.user?.id ?? null,
      });
    } catch {
      // Persistencia local ja segura
    }

    setSubmitting(false);
    setIsModalOpen(false);

    // Limpa campos
    setPetName("");
    setPhotoUrl("");
    setTributePeriod("");
    setGuardianName("");
    setStory("");

    toast.success("Homenagem publicada com carinho no memorial! ✨");
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto w-full">
      {/* Cabecalho da Aba */}
      <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-background to-background p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900">
          <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
          Memória & Afeto
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-amber-950 sm:text-5xl">
          Cantinho da Saudade ✨
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Um memorial de carinho para homenagear e guardar para sempre os pets que viraram
          estrelinhas.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 rounded-full border border-amber-300 bg-amber-500 font-bold text-white shadow-md hover:bg-amber-600 hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Homenagear uma Estrelinha
          </Button>
        </div>
      </section>

      {/* Card Fixo de Homenagem Especial - Quindim */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-card to-amber-100/30 p-6 shadow-md md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Foto com enquadramento vertical */}
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] shrink-0 overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-muted shadow-sm md:w-72">
            <img
              src={pinnedPet.photo_url || "/pets/quindim.jpg"}
              alt={pinnedPet.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              style={{ objectPosition: "center top" }}
              onError={(e) => {
                // Fallback elegante caso o caminho falhe
                (e.currentTarget as HTMLImageElement).src = "/mascot.jpg";
              }}
            />
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-500/95 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-current" />
              Estrelinha Inspiração
            </div>
          </div>

          {/* Conteudo do Quindim */}
          <div className="flex flex-1 flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-amber-950 sm:text-4xl">
                  {pinnedPet.name}
                </h2>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-medium text-amber-900">
                  <Heart className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Eterno no Coração
                </div>
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                <Calendar className="h-4 w-4 shrink-0 text-amber-600" />
                {pinnedPet.tribute_period}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {pinnedPet.story}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-amber-200/70">
              <span className="text-xs italic text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span>Homenagem dos voluntários e protetores da UnB</span>
                <a
                  href="https://www.instagram.com/resgatosunb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-900 underline hover:text-amber-950 inline-flex items-center gap-0.5 not-italic"
                >
                  (@resgatosunb)
                </a>
              </span>

              <Button
                variant={likedMap[pinnedPet.id] ? "default" : "outline"}
                onClick={() => handleSendLove(pinnedPet.id)}
                className={`gap-2 rounded-full font-bold shadow-sm transition-all ${
                  likedMap[pinnedPet.id]
                    ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
                    : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                }`}
              >
                <Heart
                  className={`h-4 w-4 transition-transform ${
                    likedMap[pinnedPet.id] ? "fill-current scale-110" : "text-amber-600"
                  }`}
                />
                Enviar carinho 💛 ({pinnedPet.likes_count})
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mural da Comunidade (exibido apenas se houver homenagens postadas por usuarios) */}
      {communityPets.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Mural da Comunidade 🌟
              </h2>
              <p className="text-sm text-muted-foreground">
                Histórias e memórias compartilhadas por tutores e protetores carinhosos.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 rounded-full border border-amber-300 bg-amber-500 font-semibold text-white hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />+ Homenagear uma Estrelinha
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {communityPets.map((pet) => (
              <article
                key={pet.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-200/60 bg-card p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={pet.photo_url || "/mascot.jpg"}
                      alt={pet.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/mascot.jpg";
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground">{pet.name}</h3>
                    {pet.tribute_period && (
                      <p className="mt-0.5 text-xs font-medium text-amber-800">
                        {pet.tribute_period}
                      </p>
                    )}
                    {pet.guardian_name && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" /> Tutor(a): {pet.guardian_name}
                      </p>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {pet.story}
                  </p>
                </div>

                <div className="mt-5 pt-3 flex items-center justify-between border-t border-border/60">
                  <span className="text-xs text-muted-foreground">Para sempre lembrado ✨</span>

                  <Button
                    size="sm"
                    variant={likedMap[pet.id] ? "default" : "outline"}
                    onClick={() => handleSendLove(pet.id)}
                    className={`gap-1.5 rounded-full text-xs font-semibold ${
                      likedMap[pet.id]
                        ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
                        : "border-amber-200 bg-amber-50/50 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        likedMap[pet.id] ? "fill-current text-white" : "text-amber-600"
                      }`}
                    />
                    {pet.likes_count}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Modal / Formulario de Postagem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-amber-950">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Homenagear uma Estrelinha
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Guarde a lembrança do seu companheiro de quatro patas no nosso mural de carinho.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label
                htmlFor="pet-name"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Nome do Pet *
              </Label>
              <Input
                id="pet-name"
                required
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Ex: Quindim, Meg, Bob..."
                className="mt-1 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Foto do Pet (Upload ou Link)
              </Label>
              <div className="mt-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={photoUrl.startsWith("data:") ? "" : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="rounded-xl flex-1 text-sm"
                  />
                  <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-primary hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    Arquivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {photoUrl && (
                  <div className="relative mt-1 h-32 w-full overflow-hidden rounded-xl border border-border">
                    <img src={photoUrl} alt="Prévia" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label
                htmlFor="tribute-period"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Período ou Data Especial (Opcional)
              </Label>
              <Input
                id="tribute-period"
                value={tributePeriod}
                onChange={(e) => setTributePeriod(e.target.value)}
                placeholder="Ex: 2018 – 2026 ou Para sempre conosco"
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div>
              <Label
                htmlFor="guardian-name"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Seu Nome ou Nome do Tutor (Opcional)
              </Label>
              <Input
                id="guardian-name"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Ex: Maria Clara, Família Silva..."
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="pet-story"
                  className="text-xs font-bold uppercase tracking-wider text-foreground"
                >
                  Mensagem de Saudade / História *
                </Label>
                <span className="text-xs text-muted-foreground">{story.length}/600</span>
              </div>
              <Textarea
                id="pet-story"
                required
                maxLength={600}
                rows={4}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Conte o que tornou seu pet inesquecível, suas travessuras, ou a saudade que ele deixou..."
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-amber-500 font-bold text-white hover:bg-amber-600 shadow-md"
              >
                {submitting ? "Publicando..." : "Publicar Homenagem ✨"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
