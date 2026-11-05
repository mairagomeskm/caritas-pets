import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Paperclip, Mic, Send, Square, Pin, Check, CheckCheck, FileText, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { signedUrl, uploadChatFile } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/chats/$id")({
  head: () => ({
    meta: [
      { title: "Conversa — Carita's Pets" },
      { name: "description", content: "Chat entre adotante, protetor e suporte." },
    ],
  }),
  component: ChatRoom,
});

interface ChatMessage {
  id: string;
  sender_id: string | null;
  is_bot: boolean;
  body: string | null;
  attachment_path: string | null;
  attachment_type: string | null;
  read_at: string | null;
  created_at: string;
}

function ChatRoom() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () =>
      (
        await supabase
          .from("conversations")
          .select("*, pets(name, photo_url)")
          .eq("id", id)
          .single()
      ).data,
  });

  const { data: msgs = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at");
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`msgs-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", id] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!user) return;
    const hasUnread = msgs.some((m) => !m.read_at && m.sender_id !== user.id);
    if (hasUnread) {
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .is("read_at", null)
        .or(`sender_id.is.null,sender_id.neq.${user.id}`)
        .then(() => {});
    }
  }, [msgs, user, id]);

  const send = async (body: string | null, attachment?: { path: string; type: string }) => {
    if (!user) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: user.id,
      body,
      attachment_path: attachment?.path ?? null,
      attachment_type: attachment?.type ?? null,
    });
    if (error) toast.error("Mensagem não enviada.");
    queryClient.invalidateQueries({ queryKey: ["messages", id] });
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("Arquivo muito grande (máx. 20 MB).");
    const type = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
        ? "video"
        : file.type === "application/pdf"
          ? "pdf"
          : null;
    if (!type) return toast.error("Envie fotos, vídeos ou PDF.");
    try {
      await send(null, { path: await uploadChatFile(id, file, type), type });
    } catch {
      toast.error("Falha no envio do arquivo.");
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        try {
          await send(null, { path: await uploadChatFile(id, blob, "webm"), type: "audio" });
        } catch {
          toast.error("Falha ao enviar o áudio.");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setTimeout(
        () => recorder.state === "recording" && (recorder.stop(), setRecording(false)),
        60000,
      );
    } catch {
      toast.error("Permita o uso do microfone para gravar.");
    }
  };

  const canPin = isAdmin || (conv && conv.protector_id === user?.id);
  const pinnedMessage = msgs.find((m) => m.id === conv?.pinned_message_id);

  const pinMessage = async (mid: string | null) => {
    await supabase.from("conversations").update({ pinned_message_id: mid }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["conversation", id] });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col bg-sky/60">
      <div className="flex items-center gap-3 border-b-2 border-primary/30 bg-background px-4 py-3">
        {conv?.pets?.photo_url && (
          <img src={conv.pets.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        )}
        <p className="font-bold">{conv?.title ?? "Conversa"}</p>
      </div>

      {pinnedMessage && (
        <div className="flex items-start gap-2 border-b border-primary/30 bg-accent px-4 py-2 text-sm">
          <Pin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1">{pinnedMessage.body}</p>
          {canPin && (
            <button className="text-xs underline" onClick={() => pinMessage(null)}>
              desafixar
            </button>
          )}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-secondary"
                    : m.is_bot
                      ? "rounded-bl-sm bg-accent"
                      : "rounded-bl-sm bg-card"
                }`}
              >
                {m.is_bot && (
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-primary">
                    <Bot className="h-3 w-3" /> Assistente
                  </p>
                )}
                {m.attachment_path && (
                  <Attachment path={m.attachment_path} type={m.attachment_type} />
                )}
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                  {canPin && m.id !== conv?.pinned_message_id && (
                    <button
                      onClick={() => pinMessage(m.id)}
                      className="mr-auto opacity-0 group-hover:opacity-100"
                      aria-label="Fixar"
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                  )}
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {mine &&
                    (m.read_at ? (
                      <span title="Lido">
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      </span>
                    ) : (
                      <span title="Enviado">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t-2 border-primary/30 bg-background p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            send(text.trim());
            setText("");
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Anexar"
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-accent"
        >
          <Paperclip />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={recording ? "Gravando áudio…" : "Digite sua mensagem"}
          className="h-11 flex-1 rounded-full border bg-card px-4"
        />
        {text.trim() ? (
          <button
            type="submit"
            aria-label="Enviar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleRecording}
            aria-label="Gravar áudio"
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </form>
    </div>
  );
}

function Attachment({ path, type }: { path: string; type: string | null }) {
  const { data: url } = useQuery({
    queryKey: ["signed", path],
    queryFn: () => signedUrl("chat-attachments", path),
    staleTime: 50 * 60 * 1000,
  });
  if (!url) return <p className="text-xs italic">carregando anexo…</p>;
  if (type === "image") return <img src={url} alt="anexo" className="mb-1 max-h-64 rounded-lg" />;
  if (type === "video") return <video src={url} controls className="mb-1 max-h-64 rounded-lg" />;
  if (type === "audio")
    return <audio src={url} controls className="mb-1 h-10 w-60 rounded-full bg-accent" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mb-1 flex items-center gap-2 rounded bg-card/70 p-2 underline"
    >
      <FileText className="h-5 w-5 text-primary" /> Documento PDF
    </a>
  );
}
