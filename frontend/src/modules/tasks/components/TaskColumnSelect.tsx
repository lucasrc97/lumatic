import { useTranslation } from "react-i18next";

import { NativeSelect } from "@/shared/components/ui/native-select";
import { cn } from "@/shared/lib/utils";

import type { Task, TaskColumn } from "../types/task";

interface TaskColumnSelectProps {
  task: Task;
  columns: TaskColumn[];
  disabled: boolean;
  onMove: (columnId: number) => void;
  className?: string;
}

/** Moves a task to another column (the done column completes it). */
export default function TaskColumnSelect({
  task,
  columns,
  disabled,
  onMove,
  className,
}: TaskColumnSelectProps) {
  const { t } = useTranslation();
  const id = `task-${task.id}-column`;

  return (
    <>
      <label htmlFor={id} className="sr-only">
        {t("tasks.card.moveLabel", { title: task.title })}
      </label>
      <NativeSelect
        id={id}
        value={task.column_id}
        disabled={disabled}
        onChange={(event) => onMove(Number(event.target.value))}
        className={cn("h-8 py-1 text-xs md:text-xs", className)}
      >
        {columns.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name}
          </option>
        ))}
      </NativeSelect>
    </>
  );
}
