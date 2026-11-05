export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  answered: boolean;
  timestamp: string;
}

export const COOKIE_STORAGE_KEY = "caritas_cookie_preferences_v1";

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  answered: false,
  timestamp: "",
};

export function openCookieSettings(): void {
  try {
    const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
    const event = new CustomEvent("open-cookie-settings", { detail: stored });
    window.dispatchEvent(event);
  } catch {
    // Falha silenciosa se localStorage ou CustomEvent não estiverem disponíveis
  }
}
