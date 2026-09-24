import { format, parseISO } from "date-fns";
import { CalendarDays, Flag, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { NativeSelect } from "@/shared/components/ui/native-select";
import { useDateLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { PRIORITY_COLORS } from "../lib/priority";
import type { Task, TaskColumn } from "../types/task";

interface TaskCardProps {
  task: Task;
  columns: TaskColumn[];
  /** `yyyy-MM-dd`, to flag overdue tasks. */
  today: string;
  disabled?: boolean;
  onMove: (columnId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({
  task,
  columns,
  today,
  disabled = false,
  onMove,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const isCompleted = task.completed_at !== null;
  const isOverdue = !isCompleted && task.due_date !== null && task.due_date < today;
  const priorityColor = PRIORITY_COLORS[task.priority];
  const moveId = `task-${task.id}-column`;

  return (
    <article
      className={cn(
        "space-y-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm",
        priorityColor && "border-l-4",
      )}
      style={priorityColor ? { borderLeftColor: priorityColor } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "min-w-0 break-words font-medium",
            isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </h3>
        <div className="-mr-2 -mt-1 flex shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled}
            aria-label={t("tasks.card.editLabel", { title: task.title })}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
                aria-label={t("tasks.card.deleteLabel", { title: task.title })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title={t("tasks.card.deleteTitle")}
            description={t("tasks.card.deleteDescription", { title: task.title })}
            confirmLabel={t("tasks.card.delete")}
            onConfirm={onDelete}
            destructive
          />
        </div>
      </div>

      {task.description && (
        <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
          {task.description}
        </p>
      )}

      {(task.due_date || priorityColor) && (
        <ul className="flex flex-wrap gap-1 text-xs">
          {priorityColor && (
            <li
              className="flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white"
              style={{ backgroundColor: priorityColor }}
            >
              <Flag className="h-3 w-3" aria-hidden />
              <span className="sr-only">{t("tasks.priority.label")}:</span>
              {t(`tasks.priority.${task.priority}`)}
            </li>
          )}
          {task.due_date && (
            <li
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5",
                isOverdue && "border-destructive text-destructive",
              )}
            >
              <CalendarDays className="h-3 w-3" aria-hidden />
              {format(parseISO(task.due_date), t("dates.dayShort"), { locale })}
              {isOverdue && <span className="sr-only">({t("tasks.card.overdue")})</span>}
            </li>
          )}
        </ul>
      )}

      <div>
        <label htmlFor={moveId} className="sr-only">
          {t("tasks.card.moveLabel", { title: task.title })}
        </label>
        <NativeSelect
          id={moveId}
          value={task.column_id}
          disabled={disabled}
          onChange={(event) => onMove(Number(event.target.value))}
          className="h-8 py-1 text-xs md:text-xs"
        >
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </article>
  );
}
