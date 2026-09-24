import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import i18n, { DEFAULT_LANGUAGE } from "@/shared/i18n";

afterEach(async () => {
  cleanup();
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});
