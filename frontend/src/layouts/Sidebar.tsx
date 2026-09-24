import { CalendarDays, KanbanSquare, ListChecks, Settings, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import LanguageSwitcher from "@/shared/components/LanguageSwitcher";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { to: "/habits", labelKey: "nav.habits", icon: ListChecks },
  { to: "/tasks", labelKey: "nav.tasks", icon: KanbanSquare },
  { to: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { to: "/trash", labelKey: "nav.trash", icon: Trash2 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col p-4">
      <nav aria-label={t("nav.main")} className="flex flex-col gap-1">
        <span className="mb-4 px-3 text-lg font-semibold">Lumatic</span>
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-1 pt-4">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
