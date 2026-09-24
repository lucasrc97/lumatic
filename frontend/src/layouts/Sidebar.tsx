import { CalendarDays, ListChecks } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { to: "/habits", label: "Hábitos", icon: ListChecks },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav aria-label="Navegação principal" className="flex h-full flex-col gap-1 p-4">
      <span className="mb-4 px-3 text-lg font-semibold">Lumatic</span>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
