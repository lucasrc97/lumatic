import { Archive, Flame, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";

import type { HabitProgress } from "../types/habit";
import HabitWeekGrid from "./HabitWeekGrid";

interface HabitCardProps {
  habit: HabitProgress;
  days: string[];
  today: string;
  isUpdating: boolean;
  onToggleDay: (day: string, completed: boolean) => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function HabitCard({
  habit,
  days,
  today,
  isUpdating,
  onToggleDay,
  onArchive,
  onDelete,
}: HabitCardProps) {
  const { t } = useTranslation();
  const doneCount = habit.completed_dates.length;
  const percent = days.length ? Math.round((doneCount / days.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: habit.color }}
              aria-hidden
            />
            <span className="truncate">{habit.name}</span>
          </CardTitle>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="h-4 w-4" aria-hidden />
            {t("habits.card.streak", { count: habit.current_streak })}
            <span aria-hidden>·</span> {t("habits.card.record", { count: habit.longest_streak })}
          </p>
        </div>

        <div className="flex shrink-0">
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("habits.card.archiveLabel", { name: habit.name })}
              >
                <Archive className="h-4 w-4" />
              </Button>
            }
            title={t("habits.card.archiveTitle")}
            description={t("habits.card.archiveDescription", { name: habit.name })}
            confirmLabel={t("habits.card.archive")}
            onConfirm={onArchive}
          />
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("habits.card.deleteLabel", { name: habit.name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title={t("habits.card.deleteTitle")}
            description={t("habits.card.deleteDescription", { name: habit.name })}
            confirmLabel={t("habits.card.delete")}
            onConfirm={onDelete}
            destructive
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        <HabitWeekGrid
          days={days}
          completedDates={habit.completed_dates}
          today={today}
          color={habit.color}
          disabled={isUpdating}
          onToggle={onToggleDay}
        />
        <div className="flex items-center gap-2">
          <Progress value={percent} className="h-2" aria-label={t("habits.card.weekProgress")} />
          <span className="text-xs tabular-nums text-muted-foreground">
            {doneCount}/{days.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
