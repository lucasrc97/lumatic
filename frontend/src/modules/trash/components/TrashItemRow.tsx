import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { useDateLocale } from "@/shared/i18n";

import type { TrashItem } from "../types/trash";

/** Translation key for each module's item label; unknown modules show their raw name. */
const MODULE_LABEL_KEYS = {
  habits: "trash.modules.habits",
  tasks: "trash.modules.tasks",
} as const;

function isKnownModule(module: string): module is keyof typeof MODULE_LABEL_KEYS {
  return Object.hasOwn(MODULE_LABEL_KEYS, module);
}

interface TrashItemRowProps {
  item: TrashItem;
  now: Date;
  disabled?: boolean;
  onRestore: () => void;
  onPurge: () => void;
}

export default function TrashItemRow({
  item,
  now,
  disabled = false,
  onRestore,
  onPurge,
}: TrashItemRowProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const daysLeft = Math.max(0, differenceInCalendarDays(parseISO(item.purge_at), now));
  const moduleLabel = isKnownModule(item.module) ? t(MODULE_LABEL_KEYS[item.module]) : item.module;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {moduleLabel} ·{" "}
          {t("trash.deletedOn", {
            date: format(parseISO(item.deleted_at), t("dates.dayShort"), { locale }),
          })}{" "}
          · {daysLeft === 0 ? t("trash.purgesToday") : t("trash.purgesIn", { count: daysLeft })}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={t("trash.restoreLabel", { title: item.title })}
          onClick={onRestore}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("trash.restore")}</span>
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={t("trash.purgeLabel", { title: item.title })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t("trash.purge")}</span>
            </Button>
          }
          title={t("trash.purgeTitle")}
          description={t("trash.purgeDescription", { title: item.title })}
          confirmLabel={t("trash.purge")}
          onConfirm={onPurge}
          destructive
        />
      </div>
    </li>
  );
}
