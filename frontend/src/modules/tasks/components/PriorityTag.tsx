import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PRIORITY_COLORS } from "../lib/priority";
import type { Priority } from "../types/task";

/** Colored priority label; nothing for tasks without a priority. */
export default function PriorityTag({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  const color = PRIORITY_COLORS[priority];
  if (!color) return null;

  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      <Flag className="h-3 w-3" aria-hidden />
      <span className="sr-only">{t("tasks.priority.label")}:</span>
      {t(`tasks.priority.${priority}`)}
    </span>
  );
}
