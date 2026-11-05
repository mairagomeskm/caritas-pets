import { useState } from "react";
import { ShieldAlert, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { recordConsent } from "@/lib/privacy-consent";
import { logAuditAccess } from "@/lib/audit-logger";

interface AdoptionConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  petId: string;
  petName: string;
  protectorName?: string;
  onConsentGranted: () => void;
}

export function AdoptionConsentModal({
  open,
  onOpenChange,
  userId,
  petId,
  petName,
  protectorName = "a ONG / Protetor responsável",
  onConsentGranted,
}: AdoptionConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!agreed) return;
    setLoading(true);

    try {
      await recordConsent({
        userId,
        consentType: "compartilhamento_com_ong",
        version: "1.0",
        status: "granted",
        metadata: {
          pet_id: petId,
          pet_name: petName,
          protector_name: protectorName,
          finalidade: "Avaliação de aptidão para adoção responsável e segurança animal",
        },
      });

      await logAuditAccess({
        actorId: userId,
        actorRole: "adotante",
        action: "share_applicant_data",
        resource: "adopter_screening_form",
        details: {
          pet_id: petId,
          pet_name: petName,
          shared_with: protectorName,
        },
      });

      onConsentGranted();
    } catch {
      // Prossegue em contingência para não bloquear o adotante
      onConsentGranted();
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary flex items-center gap-1">
              <Lock className="h-3 w-3" /> LGPD · Art. 7º, I e V
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground leading-snug">
            Consentimento para Compartilhamento da Ficha com {protectorName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Para intermediar a adoção responsável de <strong>{petName}</strong>, precisamos da sua
            permissão explícita antes de enviar seus dados para avaliação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          <div className="rounded-xl border border-primary/20 bg-accent/40 p-3.5 space-y-2">
            <p className="font-semibold text-foreground">
              Quais dados serão compartilhados com o protetor?
            </p>
            <ul className="space-y-1.5 text-muted-foreground pl-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <b>Dados de Contato:</b> Nome e WhatsApp para alinhamento da entrevista.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <b>Censo de Adoção:</b> Tipo de moradia, telas de proteção e rotina familiar.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <b>Comprovante de Residência no DF:</b> Exclusivamente para validação territorial.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3 text-[11px] text-emerald-950 space-y-1">
            <p className="font-bold flex items-center gap-1 text-emerald-800">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-700" /> Garantias de Proteção e
              Sigilo:
            </p>
            <p>
              • Os dados serão utilizados <strong>exclusivamente</strong> para a triagem deste pet.
              <br />
              • O protetor é legalmente obrigado a manter sigilo e não repassar suas informações a
              terceiros.
              <br />• Caso a adoção não seja concretizada, seus arquivos temporários serão
              expurgados após 60 dias.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border-2 border-primary/25 bg-card p-3">
            <Checkbox
              id="adoption-consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(!!checked)}
              className="mt-0.5"
            />
            <label
              htmlFor="adoption-consent"
              className="text-xs leading-relaxed text-foreground cursor-pointer select-none"
            >
              <strong>Autorizo expressamente</strong> o compartilhamento da minha ficha e documentos
              com <strong>{protectorName}</strong> exclusivamente para avaliação do pedido de adoção
              de <strong>{petName}</strong>.
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-primary/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!agreed || loading}
            onClick={handleConfirm}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            {loading ? "Registrando..." : "Autorizar e Iniciar Chat"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
