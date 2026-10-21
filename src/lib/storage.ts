import { supabase } from "@/integrations/supabase/client";
import { sanitizeMediaUpload } from "./exif-sanitizer";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

const ext = (f: File | Blob, fallback: string) =>
  f instanceof File && f.name.includes(".") ? f.name.split(".").pop() : fallback;

export async function uploadMedia(userId: string, rawFile: File): Promise<string> {
  const file = await sanitizeMediaUpload(rawFile);
  try {
    const path = `${userId}/${crypto.randomUUID()}.${ext(file, "jpg")}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      upsert: true,
      ...(file.type ? { contentType: file.type } : {}),
    });
    if (!error) {
      const { data, error: e2 } = await supabase.storage
        .from("media")
        .createSignedUrl(path, TEN_YEARS);
      if (!e2 && data?.signedUrl) return data.signedUrl;
      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      if (pub?.publicUrl) return pub.publicUrl;
    }
  } catch (err) {
    console.warn("Supabase storage upload failed, falling back to local data URL:", err);
  }

  // Graceful fallback to Data URL for instant preview & persistence
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

export async function uploadProof(userId: string, rawFile: File): Promise<string> {
  const file = await sanitizeMediaUpload(rawFile);
  const fallback = file.type === "application/pdf" ? "pdf" : "jpg";
  const path = `${userId}/comprovante-${Date.now()}.${ext(file, fallback)}`;

  try {
    const { error } = await supabase.storage.from("proofs").upload(path, file, {
      upsert: true,
      ...(file.type ? { contentType: file.type } : {}),
    });
    if (!error) {
      const { data, error: e2 } = await supabase.storage
        .from("proofs")
        .createSignedUrl(path, TEN_YEARS);
      if (!e2 && data?.signedUrl) return data.signedUrl;
      const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);
      if (pub?.publicUrl) return pub.publicUrl;
      return path;
    }
  } catch (err) {
    console.warn("Storage upload to 'proofs' bucket failed, falling back to local data URL:", err);
  }

  // Graceful base64 fallback so saving comprovante NEVER fails
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) resolve(reader.result as string);
      else resolve(URL.createObjectURL(file));
    };
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

export async function uploadChatFile(
  conversationId: string,
  rawFile: File | Blob,
  fallbackExt: string,
) {
  let file = rawFile;
  if (rawFile instanceof File) {
    file = await sanitizeMediaUpload(rawFile);
  }
  const path = `${conversationId}/${crypto.randomUUID()}.${ext(file, fallbackExt)}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return path;
}

export async function signedUrl(bucket: string, path: string): Promise<string | null> {
  if (!path) return null;
  if (
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  try {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
