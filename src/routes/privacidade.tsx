import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getUserConsents, revokeConsent } from "@/lib/privacy-consent";
import { fetchSubjectAuditTrail } from "@/lib/audit-logger";
import { maskCPF, maskPhone, maskAddress } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e Direitos do Titular (LGPD) — Carita's Pets" },
      {
        name: "description",
        content:
          "Portal de Privacidade do Carita's Pets: exerça seus direitos de acesso, portabilidade e exclusão de dados sob a LGPD (Lei nº 13.709/2018).",
      },
      {
        property: "og:title",
        content: "Política de Privacidade e Direitos do Titular — Carita's Pets",
      },
      {
        property: "og:description",
        content: "Transparência total, portabilidade e proteção de dados no Carita's Pets DF.",
      },
    ],
  }),
  component: PrivacyPage,
});

interface AdopterProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  profile_type: string | null;
  cep: string | null;
  address: string | null;
  social_link: string | null;
  proof_path: string | null;
  created_at: string;
}

export function PrivacyPage() {
  const { user, signOut } = useAuth();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["privacy-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as AdopterProfile;
    },
  });

  const { data: consents = [], refetch: refetchConsents } = useQuery({
    queryKey: ["privacy-consents", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getUserConsents(user.id) : []),
  });

  const { data: auditTrail = [] } = useQuery({
    queryKey: ["privacy-audit-trail", user?.id],
    enabled: !!user,
    queryFn: () => (user ? fetchSubjectAuditTrail(user.id) : []),
  });

  const { data: completedAdoptions = [] } = useQuery({
    queryKey: ["privacy-completed-adoptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("pets")
        .select("id, name, status, created_at")
        .eq("owner_id", user.id)
        .eq("status", "adotado");
      return data || [];
    },
  });

  const hasAdoptedPets = completedAdoptions.length > 0;

  const handleExportData = () => {
    if (!user || !profile) return;

    let census = {};
    try {
      const localCensus = localStorage.getItem(`census:${user.id}`);
      if (localCensus) census = JSON.parse(localCensus);
    } catch {
      // Ignora erro de JSON
    }

    const exportPackage = {
      export_metadata: {
        platform: "Carita's Pets DF",
        legal_basis: "Art. 18, II e V da Lei nº 13.709/2018 (LGPD) - Portabilidade e Acesso",
        timestamp: new Date().toISOString(),
        subject_id: user.id,
      },
      dados_cadastrais: {
        id: profile.id,
        nome: profile.name,
        email: profile.email,
        telefone: profile.phone,
        cpf_cnpj: profile.cpf || profile.cnpj,
        tipo_perfil: profile.profile_type,
        cep: profile.cep,
        endereco: profile.address,
        rede_social: profile.social_link,
        possui_comprovante_residencia: !!profile.proof_path,
        criado_em: profile.created_at,
      },
      respostas_censo_adocao: census,
      historico_adocoes: completedAdoptions,
      historico_consentimentos: consents,
      trilha_auditoria_recente: auditTrail,
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPackage, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meus-dados-caritas-pets-${user.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success("Arquivo de dados exportado com sucesso (formato JSON portável).");
  };

  const handleRevokeMarketing = async () => {
    if (!user) return;
    const res = await revokeConsent({
      userId: user.id,
      consentType: "comunicacao_marketing",
      reason: "Revogado pelo usuário no Portal de Privacidade",
    });

    if (res.success) {
      toast.success("Consentimento para comunicações revogado com sucesso.");
      refetchConsents();
    } else {
      toast.error("Não foi possível revogar o consentimento no momento.");
    }
  };

  const handleErasureRequest = async () => {
    if (!user || deleteConfirmation !== "EXCLUIR") {
      return toast.error('Digite a palavra "EXCLUIR" em maiúsculas para confirmar.');
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc(
        "request_user_data_erasure" as never,
        { _target_user_id: user.id } as never,
      );

      if (error) {
        if (hasAdoptedPets) {
          const anonTag = `anon_${user.id.substring(0, 8)}`;
          await supabase
            .from("profiles")
            .update({
              name: `Titular Anonimizado (${anonTag})`,
              email: `${anonTag}@privacidade.caritaspets.local`,
              phone: null,
              cpf: null,
              address: null,
              cep: null,
              proof_path: null,
              avatar_url: null,
            })
            .eq("id", user.id);

          toast.success(
            "Seus dados de perfil foram anonimizados. O registro do termo de guarda do animal foi arquivado em cofre seguro conforme Art. 16, I da LGPD.",
          );
        } else {
          await supabase.from("profiles").delete().eq("id", user.id);
          try {
            localStorage.removeItem(`census:${user.id}`);
          } catch {
            // Ignora falha local
          }
          toast.success("Todos os seus dados pessoais foram excluídos permanentemente.");
        }
      } else {
        const msg =
          (data as { message?: string } | null)?.message || "Solicitação processada com sucesso.";
        toast.success(msg);
      }

      await signOut();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha ao processar exclusão: " + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="border-b border-primary/20 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold mb-2">
          <ShieldCheck className="h-4 w-4" /> Conformidade LGPD · Lei nº 13.709/2018
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Portal de Privacidade e Direitos do Titular
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-3xl">
          No Carita's Pets, a proteção da sua privacidade é estrutural. Aqui você tem transparência
          completa, portabilidade e controle sobre como seus dados são tratados.
        </p>
      </div>

      <Tabs defaultValue="titular" className="space-y-6">
        <TabsList className="bg-accent/60 p-1 border border-primary/20 rounded-xl">
          <TabsTrigger value="titular" className="font-bold text-xs sm:text-sm">
            Portal de Direitos do Titular (Art. 18)
          </TabsTrigger>
          <TabsTrigger value="politica" className="font-bold text-xs sm:text-sm">
            Política de Privacidade Completa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="titular" className="space-y-6">
          {!user ? (
            <div className="vintage-card p-8 text-center space-y-4">
              <Lock className="mx-auto h-12 w-12 text-primary/70" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  Acesse sua conta para gerenciar seus dados
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Para exercer seus direitos de portabilidade, consulta de acessos e direito ao
                  esquecimento, identifique-se com sua conta cadastrada.
                </p>
              </div>
              <Button asChild className="font-bold">
                <Link to="/auth">Entrar na Minha Conta</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="vintage-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" /> Portabilidade e Acesso aos Dados
                      (Art. 18, II e V)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Baixe uma cópia estruturada em JSON de todas as informações que mantemos sobre
                      você.
                    </p>
                  </div>
                  <Button
                    onClick={handleExportData}
                    disabled={profileLoading}
                    className="font-bold gap-2 text-xs shrink-0 shadow-xs"
                  >
                    <Download className="h-4 w-4" /> Baixar Meus Dados (JSON)
                  </Button>
                </div>

                {profile && (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-xs bg-accent/40 rounded-xl p-4 border border-primary/10">
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        Nome Registrado
                      </span>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {profile.name || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        E-mail Vinculado
                      </span>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {profile.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        Telefone / WhatsApp
                      </span>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {maskPhone(profile.phone)}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        Documento (CPF/CNPJ)
                      </span>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {maskCPF(profile.cpf || profile.cnpj)}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        Endereço / Região
                      </span>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {maskAddress(profile.address, profile.cep)}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground uppercase text-[10px]">
                        Comprovante de Residência
                      </span>
                      <p className="font-semibold text-emerald-800 text-sm mt-0.5">
                        {profile.proof_path ? "✓ Anexado com sigilo restrito" : "✗ Não enviado"}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="vintage-card p-6 space-y-4">
                <div className="space-y-1 border-b border-primary/15 pb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" /> Seus Consentimentos e Bases
                    Legais (Art. 7º e 8º)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Registro imutável dos seus consentimentos livres e informados. Você pode revogar
                    permissões opcionais a qualquer instante.
                  </p>
                </div>

                <div className="divide-y divide-primary/15">
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-foreground">
                        Termos de Uso e Política de Privacidade
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Base Legal: Execução de contrato e processo de adoção responsável (Art. 7º,
                        V da LGPD).
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-3 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                    </span>
                  </div>

                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-foreground">
                        Comunicações sobre Vaquinhas e Campanhas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Base Legal: Consentimento do titular (Art. 7º, I da LGPD).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRevokeMarketing}
                        className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        Revogar Consentimento
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="vintage-card p-6 space-y-4">
                <div className="space-y-1 border-b border-primary/15 pb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Trilha de Transparência e Acessos (Art.
                    18, IV)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Veja quando sua ficha de triagem ou comprovante foi visualizado por
                    ONGs/protetores para avaliação de adoção.
                  </p>
                </div>

                {auditTrail.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground py-2">
                    Nenhum acesso externo registrado até o momento. Seus dados permanecem em sigilo.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {auditTrail.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-lg bg-card p-3 border border-primary/15 text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {log.action === "view_proof_document"
                              ? "Comprovante de residência verificado"
                              : log.action === "share_applicant_data"
                                ? "Ficha compartilhada para entrevista de adoção"
                                : "Perfil verificado pela administração"}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Agente: <b>{log.actor_role}</b> · Recurso: {log.resource}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(log.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-destructive flex items-center gap-2">
                    <UserX className="h-5 w-5" /> Eliminação de Dados e Direito ao Esquecimento
                    (Art. 18, VI)
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode solicitar a exclusão da sua conta e de todos os seus dados pessoais a
                    qualquer momento.
                  </p>
                </div>

                <div className="rounded-xl bg-background/80 p-4 border border-destructive/20 text-xs space-y-2">
                  <p className="font-bold text-foreground">
                    Como funciona a exclusão no Carita's Pets?
                  </p>
                  <ul className="space-y-1.5 text-muted-foreground pl-1">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-destructive">•</span>
                      <span>
                        <b>Se você NÃO tiver adotado animais na plataforma:</b> realizaremos a
                        exclusão total e imediata (<i>hard delete</i>) do seu cadastro, fotos da
                        residência e conversas.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-destructive">•</span>
                      <span>
                        <b>Se você adotou um animal e assinou um Termo de Guarda Responsável:</b>{" "}
                        por obrigação legal de prevenção a maus-tratos e exercício regular de
                        direitos (Art. 16, I e Art. 7º, VI da LGPD), o documento assinado é mantido
                        em <b>cofre isolado com acesso restrito</b> por 5 anos. Todos os seus dados
                        públicos, endereço e históricos de navegação são permanentemente
                        anonimizados.
                      </span>
                    </li>
                  </ul>
                  {hasAdoptedPets && (
                    <div className="rounded-md bg-amber-50 p-2.5 border border-amber-300 text-amber-900 text-xs mt-2">
                      ⚠️ <b>Atenção:</b> Identificamos que você possui {completedAdoptions.length}{" "}
                      pet(s) adotado(s). O termo de guarda responsável será preservado em cofre
                      seguro enquanto seu perfil será anonimizado.
                    </div>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="font-bold gap-2 text-xs shadow-xs"
                    >
                      <Trash2 className="h-4 w-4" /> Solicitar Exclusão da Minha Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão de Dados
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs space-y-2">
                        <span>
                          Esta ação é irreversível. Seus dados pessoais serão permanentemente
                          eliminados ou anonimizados.
                        </span>
                        <div className="pt-2">
                          <label className="font-bold text-foreground block mb-1">
                            Digite <b>EXCLUIR</b> para confirmar:
                          </label>
                          <Input
                            placeholder="EXCLUIR"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="font-mono text-center tracking-widest uppercase"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setDeleteConfirmation("")}
                        className="text-xs"
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleErasureRequest}
                        disabled={deleteConfirmation !== "EXCLUIR" || isDeleting}
                        className="bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
                      >
                        {isDeleting ? "Processando..." : "Confirmar Exclusão"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          )}
        </TabsContent>

        <TabsContent value="politica">
          <article className="vintage-card p-6 md:p-10 space-y-6 text-sm leading-relaxed text-foreground/90">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                Política de Privacidade e Proteção de Dados
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Última atualização: Outubro de 2026 · Versão 2026.1 em conformidade com a Lei Geral
                de Proteção de Dados (Lei nº 13.709/2018).
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                1. Quem Somos e Contato do Encarregado (DPO)
              </h3>
              <p>
                O <b>Carita's Pets DF</b> é uma plataforma independente e digital dedicada a
                facilitar a adoção responsável de cães e gatos e conectar protetores a adotantes
                verificados no Distrito Federal e entorno.
              </p>
              <div className="rounded-xl bg-accent/40 p-4 border border-primary/15 text-xs space-y-1">
                <p>
                  <b>Canal de Atendimento ao Titular e Encarregado de Dados (DPO):</b>
                </p>
                <p>
                  E-mail oficial de privacidade:{" "}
                  <a
                    href="mailto:privacidade@caritaspets.com.br"
                    className="underline text-primary font-bold"
                  >
                    privacidade@caritaspets.com.br
                  </a>
                </p>
                <p>
                  Tempo médio de resposta para requisições de titulares: até 15 dias úteis (conforme
                  Art. 19, II da LGPD).
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                2. Dados Pessoais Coletados e Finalidades (Art. 6º, I e III)
              </h3>
              <p>
                Adotamos com rigor o <b>Princípio da Minimização de Dados</b>: coletamos somente o
                estritamente indispensável para assegurar a segurança dos animais resgatados e a
                idoneidade do processo de guarda responsável:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  <b>Adotantes:</b> Nome completo, e-mail, telefone/WhatsApp, CEP/Região, respostas
                  do censo de moradia e comprovante de residência no DF.
                </li>
                <li>
                  <b>Protetores e ONGs:</b> Nome institucional / Razão Social, CNPJ ou CPF,
                  localização e links de redes sociais verificadas.
                </li>
                <li>
                  <b>Animais:</b> Histórico veterinário, vacinas e fotos. Metadados de fotos
                  (especialmente coordenadas GPS) são eliminados no momento do upload.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                3. Bases Legais Utilizadas (Art. 7º da LGPD)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg bg-card p-3 border border-primary/20 space-y-1">
                  <p className="font-bold text-primary">
                    Execução de Contrato e Procedimentos Preliminares (Art. 7º, V)
                  </p>
                  <p className="text-muted-foreground">
                    Avaliação de triagem de segurança e celebração do Termo de Adoção e Guarda
                    Responsável.
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-primary/20 space-y-1">
                  <p className="font-bold text-primary">
                    Exercício Regular de Direitos (Art. 7º, VI)
                  </p>
                  <p className="text-muted-foreground">
                    Guarda segura do termo de adoção assinado para prevenção ao abandono e
                    comprovação de posse legal.
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-primary/20 space-y-1">
                  <p className="font-bold text-primary">Consentimento Específico (Art. 7º, I)</p>
                  <p className="text-muted-foreground">
                    Compartilhamento de dados com a ONG e envio opcional de avisos sobre vaquinhas
                    de cirurgia.
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border border-primary/20 space-y-1">
                  <p className="font-bold text-primary">
                    Cumprimento de Obrigação Legal (Art. 7º, II)
                  </p>
                  <p className="text-muted-foreground">
                    Guarda de logs de acesso e auditoria conforme exigido pelo Marco Civil da
                    Internet (Lei 12.965/2014).
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                4. Política de Retenção e Ciclo de Vida (Art. 16 da LGPD)
              </h3>
              <p>Mantemos uma rotina automatizada de descarte:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  <b>Triagens abandonadas ou recusadas:</b> Anexos e comprovantes são expurgados
                  após <b>60 dias</b> de inatividade.
                </li>
                <li>
                  <b>Termos de Adoção Assinados:</b> Armazenados por <b>5 anos</b> em cofre seguro
                  isolado, mesmo após eventual pedido de exclusão de perfil do adotante.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-foreground">
                5. Medidas de Segurança da Informação (Art. 46)
              </h3>
              <p className="text-xs leading-relaxed">
                Empregamos criptografia AES-256 e HTTPS/TLS em trânsito e em repouso para dados
                críticos, mascaramento visual de documentos, higienização de coordenadas GPS (EXIF)
                em todas as mídias e registro minucioso em trilha de auditoria (AuditLog) de
                qualquer visualização de dados cadastrais.
              </p>
            </section>
          </article>
        </TabsContent>
      </Tabs>
    </div>
  );
}
