/**
 * Módulo de Criptografia e Mascaramento de Dados Sensíveis (LGPD Art. 46)
 * Utiliza Web Crypto API padrão (AES-GCM 256-bit) compatível com Browser e Server/Node.
 */

const DEFAULT_SECRET = "caritas-pets-lgpd-secret-encryption-key-2026";

/**
 * Deriva uma chave criptográfica AES-GCM a partir de uma senha mestra
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Criptografa um dado sensível (CPF, RG, Endereço Completo) em formato seguro.
 * Retorna no formato: enc:v1:<salt_hex>:<iv_hex>:<ciphertext_hex>
 */
export async function encryptSensitiveData(
  plainText: string,
  customSecret?: string,
): Promise<string> {
  if (!plainText) return plainText;
  try {
    const enc = new TextEncoder();
    const secret =
      customSecret ||
      (typeof process !== "undefined" ? process.env?.["ENCRYPTION_KEY"] : "") ||
      DEFAULT_SECRET;

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(secret, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plainText),
    );

    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const cipherHex = Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `enc:v1:${saltHex}:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error("[Crypto] Falha ao criptografar dado:", err);
    return plainText;
  }
}

/**
 * Descriptografa um dado sensível previamente criptografado com encryptSensitiveData.
 */
export async function decryptSensitiveData(
  cipherString: string,
  customSecret?: string,
): Promise<string> {
  if (!cipherString || !cipherString.startsWith("enc:v1:")) {
    return cipherString; // Não criptografado ou texto simples
  }

  try {
    const parts = cipherString.split(":");
    if (parts.length !== 5) return cipherString;

    const saltHex = parts[2];
    const ivHex = parts[3];
    const cipherHex = parts[4];

    if (!saltHex || !ivHex || !cipherHex) return cipherString;

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const cipherBytes = new Uint8Array(
      cipherHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );

    const secret =
      customSecret ||
      (typeof process !== "undefined" ? process.env?.["ENCRYPTION_KEY"] : "") ||
      DEFAULT_SECRET;
    const key = await deriveKey(secret, salt);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn("[Crypto] Não foi possível descriptografar:", err);
    return "[DADO PROTEGIDO]";
  }
}

/**
 * Gera um hash SHA-256 parcial para armazenar IPs de consentimento de forma pseudonimizada
 */
export async function hashIdentifier(input: string): Promise<string> {
  if (!input) return "";
  try {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(input));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
  } catch {
    return "hash_anon";
  }
}

/**
 * Mascaramento de CPF para exibição segura (Art. 6º, III - Minimização)
 * Ex: 123.456.789-00 -> 123.***.***-00
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return "***.***.***-**";
  return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
}

/**
 * Mascaramento de RG para exibição segura
 */
export function maskRG(rg: string | null | undefined): string {
  if (!rg) return "—";
  const clean = rg.trim();
  if (clean.length < 5) return "***";
  return `${clean.substring(0, 2)}***${clean.substring(clean.length - 2)}`;
}

/**
 * Mascaramento de Telefone para visualização segura
 * Ex: (61) 98765-4321 -> (61) 9****-4321
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(6)}`;
  }
  return "(61) *****-****";
}

/**
 * Mascaramento de Endereço Residencial: exibe apenas Cidade/Bairro ou Região Administrativa
 * Nunca exibe quadra, número de casa ou bloco publicamente.
 */
export function maskAddress(address: string | null | undefined, cep?: string | null): string {
  if (!address && !cep) return "Brasília/DF (Região protegida)";
  if (!address) return `DF (CEP ${cep?.slice(0, 5)}-***)`;

  // Se o endereço contiver referências a bairros comuns do DF
  const parts = address.split(",");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (last) return `${last.trim()} (Endereço exato sob sigilo)`;
  }
  return `${address.substring(0, 10)}... (Protegido por privacidade)`;
}
