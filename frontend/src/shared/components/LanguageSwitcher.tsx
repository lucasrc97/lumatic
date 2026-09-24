import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { LANGUAGES } from "@/shared/i18n";

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div role="group" aria-label={t("language.label")} className="flex gap-1">
      {LANGUAGES.map(({ code, label, short }) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={i18n.language === code ? "secondary" : "ghost"}
          aria-pressed={i18n.language === code}
          lang={code}
          title={label}
          onClick={() => void i18n.changeLanguage(code)}
        >
          <span aria-hidden>{short}</span>
          <span className="sr-only">{label}</span>
        </Button>
      ))}
    </div>
  );
}
