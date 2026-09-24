import { Settings, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

/** App-wide pages (not modules), shown as icon links in the top bar. */
const GLOBAL_ITEMS = [
  { to: "/trash", labelKey: "nav.trash", icon: Trash2 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export default function GlobalNav() {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("nav.global")} className="flex items-center gap-1">
      {GLOBAL_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={t(labelKey)}
          aria-label={t(labelKey)}
          className={({ isActive }) =>
            cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )
          }
        >
          <Icon className="h-5 w-5" aria-hidden />
        </NavLink>
      ))}
    </nav>
  );
}
