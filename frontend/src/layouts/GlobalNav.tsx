import { CalendarDays, Settings, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { CALENDAR_PANEL_ID } from "@/modules/calendar/lib/panelPreference";
import { cn } from "@/shared/lib/utils";

/** App-wide pages (not modules), shown as icon links in the top bar. */
const GLOBAL_ITEMS = [
  { to: "/trash", labelKey: "nav.trash", icon: Trash2 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

const ICON_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent";

interface GlobalNavProps {
  calendarOpen: boolean;
  onToggleCalendar: () => void;
}

export default function GlobalNav({ calendarOpen, onToggleCalendar }: GlobalNavProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("nav.global")} className="flex items-center gap-1">
      {/* The calendar opens as a panel above the current page instead of a page of its own. */}
      <button
        type="button"
        title={t("nav.calendar")}
        aria-label={t("nav.calendar")}
        aria-expanded={calendarOpen}
        aria-controls={CALENDAR_PANEL_ID}
        onClick={onToggleCalendar}
        className={cn(
          ICON_BUTTON,
          calendarOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        )}
      >
        <CalendarDays className="h-5 w-5" aria-hidden />
      </button>
      {GLOBAL_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={t(labelKey)}
          aria-label={t(labelKey)}
          className={({ isActive }) =>
            cn(ICON_BUTTON, isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground")
          }
        >
          <Icon className="h-5 w-5" aria-hidden />
        </NavLink>
      ))}
    </nav>
  );
}
