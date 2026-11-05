import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { openPetChat } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdoptionConsentModal } from "@/components/privacy/AdoptionConsentModal";
import { PetCard, PetDetailsModal, PetFilters, type PetSpeciesFilter } from "@/components/adoption";
import { VERIFIED_REAL_PETS } from "@/data";
import type { PetItem } from "@/types";

// Re-exports for backwards compatibility
export type { PetItem } from "@/types";
export {
  SPIKE_PET,
  CHICO_PET,
  MARI_PET,
  NALA_PET,
  RESGATADOS_UNB_PETS,
  VERIFIED_REAL_PETS,
} from "@/data";

export const Route = createFileRoute("/adocao")({
  head: () => ({
    meta: [
      { title: "Adoção Responsável — Carita's Pets DF" },
      {
        name: "description",
        content:
          "Encontre cães, gatos e filhotes para adotar no Distrito Federal. Conheça as fichas completas, temperamento e histórias de superação.",
      },
      { property: "og:title", content: "Pets para Adoção no DF — Carita's Pets" },
      {
        property: "og:description",
        content: "Cães e gatos resgatados esperando um lar cheio de carinho em Brasília e regiões.",
      },
    ],
  }),
  component: AdocaoPage,
});

function AdocaoPage() {
  const [filter, setFilter] = useState<PetSpeciesFilter>("todos");
  const [region, setRegion] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPet, setSelectedPet] = useState<PetItem | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [consentPet, setConsentPet] = useState<PetItem | null>(null);

  const { user, setAuthOpen } = useAuth();
  const navigate = useNavigate();

  const { data: dbPets = [] } = useQuery({
    queryKey: ["pets", "disponivel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*, organizations(name)")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []).map((p) => {
        const item = p as Record<string, unknown> & {
          organizations?: { name?: string } | null;
        };
        return {
          ...item,
          organization_name: item.organizations?.name,
        };
      }) as PetItem[];
    },
  });

  const rawPets = useMemo(() => {
    const map = new Map<string, PetItem>();
    VERIFIED_REAL_PETS.forEach((p) => map.set(p.id, p));
    dbPets.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [dbPets]);

  const list = useMemo(() => {
    return rawPets.filter((p) => {
      const matchesFilter =
        filter === "todos" || (filter === "filhotes" ? p.is_puppy : p.species === filter);
      const matchesRegion = region === "Todas" || p.region === region || p.region.includes(region);
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesRegion && matchesSearch;
    });
  }, [rawPets, filter, region, searchTerm]);

  const proceedToChat = async (pet: PetItem) => {
    if (!user) return;
    try {
      const cid = await openPetChat(user.id, pet.id, pet.name);
      navigate({ to: "/chats/$id", params: { id: cid } });
    } catch {
      toast.error("Não foi possível iniciar o chat de adoção no momento.");
    }
  };

  const handleInterest = async (pet: PetItem) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url, proof_path, profile_type")
        .eq("id", user.id)
        .single();

      const isAdopter = !prof?.profile_type || prof.profile_type === "adotante";
      if (isAdopter && (!prof?.avatar_url || !prof?.proof_path)) {
        setBlocked(true);
        return;
      }

      // Requisito LGPD Art. 7º, I: Opt-in explícito para envio de dados à ONG
      setConsentPet(pet);
    } catch {
      toast.error("Não foi possível processar a solicitação no momento.");
    }
  };

  const handleSharePet = async (pet: PetItem) => {
    const text = `Conheça ${pet.name}, para adoção responsável no Carita's Pets DF (${pet.region}). Venha dar um lar cheio de amor!`;
    if (navigator.share) {
      await navigator
        .share({ title: `Adote ${pet.name}`, text, url: window.location.href })
        .catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast.success("Ficha do pet copiada para compartilhar!");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Alerta de Perfil Incompleto para Adoção Segura */}
      <Dialog open={blocked} onOpenChange={setBlocked}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Complete seu Perfil Verificado
            </DialogTitle>
            <DialogDescription>
              Para a segurança dos animais resgatados, exigimos foto de perfil e comprovante de
              residência no DF antes de conversar diretamente com a ONG ou protetor.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-accent/60 p-4 border border-primary/20 text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Por que isso é necessário?</strong>
            </p>
            <p>
              Isso combate o abandono e garante que protetores conversem com adotantes reais e
              verificados.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBlocked(false)}>
              Depois
            </Button>
            <Button asChild onClick={() => setBlocked(false)}>
              <Link to="/perfil">Completar Meu Perfil Agora</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Adote um Companheiro Leal no DF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Pets Disponíveis para Adoção
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
            Clique na ficha de qualquer animal para ver seu histórico, vacinas e temperamento. Todos
            os pets são avaliados por protetores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            asChild
            variant="outline"
            className="border-primary/40 text-xs font-bold w-full sm:w-auto"
          >
            <Link to="/comunidade">Ver Histórias Felizes</Link>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <PetFilters
        filter={filter}
        onFilterChange={setFilter}
        region={region}
        onRegionChange={setRegion}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Grade de Pets */}
      {list.length === 0 ? (
        <div className="vintage-card p-12 text-center space-y-3">
          <p className="text-xl font-bold text-primary">Nenhum pet encontrado com esses filtros.</p>
          <p className="text-sm text-muted-foreground">
            Experimente mudar a espécie ou selecionar "Todas as Regiões".
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFilter("todos");
              setRegion("Todas");
              setSearchTerm("");
            }}
          >
            Ver todos os pets
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PetCard
              key={p.id}
              pet={p}
              onSelect={setSelectedPet}
              onInterest={handleInterest}
              onShare={handleSharePet}
            />
          ))}
        </div>
      )}

      {/* Modal com a Ficha Completa do Pet */}
      <PetDetailsModal
        pet={selectedPet}
        open={!!selectedPet}
        onOpenChange={(open) => !open && setSelectedPet(null)}
        onInterest={handleInterest}
        onShare={handleSharePet}
      />

      {/* Modal de Consentimento LGPD */}
      {consentPet && user && (
        <AdoptionConsentModal
          open={!!consentPet}
          onOpenChange={(open) => !open && setConsentPet(null)}
          userId={user.id}
          petId={consentPet.id}
          petName={consentPet.name}
          protectorName={consentPet.organization_name || "o Protetor responsável"}
          onConsentGranted={() => {
            const petToAdopt = consentPet;
            setConsentPet(null);
            proceedToChat(petToAdopt);
          }}
        />
      )}
    </div>
  );
}
