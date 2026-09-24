export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "system";
// Also read by the inline script in index.html, which applies the theme before first paint.
const STORAGE_KEY = "lumatic.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value);
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Storage can be unavailable (private mode, blocked site data): use the default.
    return DEFAULT_THEME;
  }
}

function systemPrefersDark(): boolean {
  // matchMedia is missing in some environments (e.g. jsdom); fall back to light.
  return window.matchMedia?.(DARK_QUERY).matches ?? false;
}

/** Toggle Tailwind's `dark` class on <html> for `theme`. */
export function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not persisting the choice is acceptable; it still applies to this session.
  }
  applyTheme(theme);
}

/** Apply the stored theme and follow OS changes while the choice is "system". */
export function initTheme(): void {
  applyTheme(readStoredTheme());
  window.matchMedia?.(DARK_QUERY).addEventListener("change", () => {
    if (readStoredTheme() === "system") applyTheme("system");
  });
}
