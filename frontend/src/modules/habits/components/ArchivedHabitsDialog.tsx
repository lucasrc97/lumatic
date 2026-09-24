import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import type { Habit } from "../types/habit";

interface ArchivedHabitsDialogProps {
  /** Archived habits; undefined while loading. */
  habits: Habit[] | undefined;
  disabled: boolean;
  error?: string | null;
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ArchivedHabitsDialog({
  habits,
  disabled,
  error,
  onUnarchive,
  onDelete,
}: ArchivedHabitsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="h-4 w-4" aria-hidden />
          {t("habits.archived.manage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("habits.archived.title")}</DialogTitle>
          <DialogDescription>{t("habits.archived.description")}</DialogDescription>
        </DialogHeader>

        {habits === undefined && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {habits?.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("habits.archived.empty")}</p>
        )}
        {!!habits?.length && (
          <ul className="space-y-2">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="flex items-center justify-between gap-2 rounded-lg border p-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: habit.color }}
                    aria-hidden
                  />
                  <span className="truncate">{habit.name}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    aria-label={t("habits.archived.unarchiveLabel", { name: habit.name })}
                    onClick={() => onUnarchive(habit.id)}
                  >
                    <ArchiveRestore className="h-4 w-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only">{t("habits.archived.unarchive")}</span>
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        disabled={disabled}
                        aria-label={t("habits.card.deleteLabel", { name: habit.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title={t("habits.card.deleteTitle")}
                    description={t("habits.card.deleteDescription", { name: habit.name })}
                    confirmLabel={t("habits.card.delete")}
                    onConfirm={() => onDelete(habit.id)}
                    destructive
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
