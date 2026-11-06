import { supabase } from "@/integrations/supabase/client";

export interface LocalConv {
  id: string;
  kind: "pet" | "support";
  pet_id?: string;
  adopter_id: string;
  title: string;
  last_message_at: string;
  pets?: { name: string; photo_url?: string } | null;
}

export function getLocalConversations(): LocalConv[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("local_conversations") ?? "[]");
  } catch {
    return [];
  }
}

function saveLocalConversation(conv: LocalConv) {
  const list = getLocalConversations();
  const idx = list.findIndex((c) => c.id === conv.id);
  if (idx >= 0) list[idx] = conv;
  else list.unshift(conv);
  try {
    localStorage.setItem("local_conversations", JSON.stringify(list));
  } catch {}
}

/** Abre (ou reaproveita) a conversa do adotante sobre um pet. */
export async function openPetChat(userId: string, petId: string, petName: string) {
  try {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("kind", "pet")
      .eq("pet_id", petId)
      .eq("adopter_id", userId)
      .maybeSingle();
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    const { error } = await supabase.from("conversations").insert({
      id,
      kind: "pet",
      pet_id: petId,
      adopter_id: userId,
      title: `Interesse em ${petName}`,
    });
    if (!error) return id;
  } catch {}

  const existingLocal = getLocalConversations().find(
    (c) => c.kind === "pet" && c.pet_id === petId && c.adopter_id === userId,
  );
  if (existingLocal) return existingLocal.id;
  const id = crypto.randomUUID();
  saveLocalConversation({
    id,
    kind: "pet",
    pet_id: petId,
    adopter_id: userId,
    title: `Interesse em ${petName}`,
    last_message_at: new Date().toISOString(),
    pets: { name: petName },
  });
  return id;
}

export async function openSupportChat(userId: string) {
  try {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("kind", "support")
      .eq("adopter_id", userId)
      .maybeSingle();
    if (existing) return existing.id;
    const id = crypto.randomUUID();
    const { error } = await supabase
      .from("conversations")
      .insert({ id, kind: "support", adopter_id: userId, title: "Suporte Carita's Pets" });
    if (!error) return id;
  } catch {}

  const existingLocal = getLocalConversations().find(
    (c) => c.kind === "support" && c.adopter_id === userId,
  );
  if (existingLocal) return existingLocal.id;
  const id = crypto.randomUUID();
  saveLocalConversation({
    id,
    kind: "support",
    adopter_id: userId,
    title: "Suporte Carita's Pets",
    last_message_at: new Date().toISOString(),
  });
  return id;
}
