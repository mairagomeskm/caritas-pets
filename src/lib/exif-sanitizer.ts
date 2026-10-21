/**
 * Utilitário de Higienização de Metadados e Remoção de EXIF (Privacy by Design)
 * Conforme o Princípio da Minimização da LGPD (Art. 6º, III), metadados desnecessários
 * (especialmente coordenadas GPS e dados do aparelho) devem ser expurgados antes do armazenamento.
 */

/**
 * Remove metadados EXIF e GPS de uma imagem no navegador utilizando renderização
 * limpa em Canvas. Esse processo reconstrói os pixels sem carregar os segmentos APP1/EXIF.
 */
export async function stripExifInBrowser(file: File): Promise<File> {
  // Se não for imagem suportada para descarte EXIF (ex: PDF ou SVG), retorna o arquivo original
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  // Tenta processar via Canvas ou ImageBitmap
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return stripExifFromJpegBinary(file);
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = outputType === "image/jpeg" ? 0.9 : undefined;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob) {
      return stripExifFromJpegBinary(file);
    }

    return new File([blob], file.name, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("[EXIF Sanitizer] Fallback para higienizador binário de EXIF:", err);
    return stripExifFromJpegBinary(file);
  }
}

/**
 * Higienizador binário de marcadores JPEG (0xFF 0xE1 - APP1 EXIF).
 * Remove diretamente os bytes contendo metadados EXIF/GPS do cabeçalho JPEG
 * sem depender do DOM/Canvas (compatível com Server-Side Rendering e Edge).
 */
export async function stripExifFromJpegBinary(file: File): Promise<File> {
  if (file.type !== "image/jpeg" && !file.name.match(/\.(jpe?g)$/i)) {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const cleanedBuffer = stripExifMarkers(arrayBuffer);
    return new File([cleanedBuffer], file.name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error("[EXIF Sanitizer] Falha na higienização binária:", err);
    return file;
  }
}

/**
 * Remove marcadores APP1 (0xFF 0xE1) que contêm tags EXIF e GPS de um ArrayBuffer JPEG.
 */
export function stripExifMarkers(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  const length = buffer.byteLength;

  // Verifica se é um arquivo JPEG válido (SOI: 0xFF 0xD8)
  if (length < 4 || view.getUint16(0) !== 0xffd8) {
    return buffer;
  }

  let offset = 2;
  const chunks: ArrayBuffer[] = [buffer.slice(0, 2)]; // Preserva SOI

  while (offset < length - 1) {
    // Procura o próximo marcador (0xFF seguido de byte diferente de 0x00 e 0xFF)
    if (view.getUint8(offset) === 0xff) {
      const marker = view.getUint8(offset + 1);

      // Fim da imagem (EOI) ou Início da varredura de dados (SOS)
      if (marker === 0xda || marker === 0xd9) {
        chunks.push(buffer.slice(offset));
        break;
      }

      // Marcadores sem comprimento adicional
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        chunks.push(buffer.slice(offset, offset + 2));
        offset += 2;
        continue;
      }

      // Marcadores com tamanho: lê os 2 bytes seguintes
      if (offset + 4 > length) break;
      const segmentLength = view.getUint16(offset + 2);

      // Se for o marcador APP1 (0xFF 0xE1 - EXIF/GPS), ignora este bloco
      if (marker === 0xe1) {
        offset += 2 + segmentLength;
        continue;
      }

      // Outros marcadores (SOF, DHT, DQT, etc.): preserva
      chunks.push(buffer.slice(offset, offset + 2 + segmentLength));
      offset += 2 + segmentLength;
    } else {
      offset++;
    }
  }

  // Se nenhum bloco APP1 foi removido, retorna o buffer original
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  if (totalLength === length) {
    return buffer;
  }

  // Constrói o buffer higienizado sem metadados
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    output.set(new Uint8Array(chunk), pos);
    pos += chunk.byteLength;
  }

  return output.buffer;
}

/**
 * Função unificada para higienizar qualquer upload de mídia
 * antes de enviar para o storage ou realizar preview.
 */
export async function sanitizeMediaUpload(file: File): Promise<File> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return stripExifInBrowser(file);
  }
  return stripExifFromJpegBinary(file);
}
