import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { readStoredTheme, setTheme, THEMES, type Theme } from "@/shared/theme";

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Theme>(readStoredTheme);

  return (
    <div role="group" aria-label={t("theme.label")} className="flex flex-wrap gap-1">
      {THEMES.map((theme) => {
        const Icon = ICONS[theme];
        return (
          <Button
            key={theme}
            type="button"
            size="sm"
            variant={current === theme ? "secondary" : "ghost"}
            aria-pressed={current === theme}
            onClick={() => {
              setTheme(theme);
              setCurrent(theme);
            }}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(`theme.${theme}`)}
          </Button>
        );
      })}
    </div>
  );
}
