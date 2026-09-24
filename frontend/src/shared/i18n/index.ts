import type { Locale } from "date-fns";
import { enUS, ptBR as ptBRDates } from "date-fns/locale";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

export const LANGUAGES = [
  { code: "pt-BR", label: "Português", short: "PT" },
  { code: "en", label: "English", short: "EN" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: Language = "pt-BR";
const STORAGE_KEY = "lumatic.language";

export const resources = {
  "pt-BR": { translation: ptBR },
  // `satisfies` makes a missing English key a type error.
  en: { translation: en satisfies typeof ptBR },
} as const;

const DATE_LOCALES: Record<Language, Locale> = { "pt-BR": ptBRDates, en: enUS };

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    // Storage can be unavailable (private mode, blocked site data): use the default.
    return DEFAULT_LANGUAGE;
  }
}

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not persisting the choice is acceptable; it still applies to this session.
  }
});

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes rendered values.
});

type ErrorCode = keyof typeof ptBR.errors;

/** Whether a backend error `code` has a translated message under `errors.*`. */
export function isTranslatedErrorCode(code: unknown): code is ErrorCode {
  return typeof code === "string" && Object.hasOwn(ptBR.errors, code);
}

/** date-fns locale matching the active UI language; re-renders on language change. */
export function useDateLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return DATE_LOCALES[isLanguage(instance.language) ? instance.language : DEFAULT_LANGUAGE];
}

export default i18n;
