import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { Task, TaskColumn } from "../types/task";

interface TaskBoardProps {
  tasks: Task[];
  columns: TaskColumn[];
  renderTask: (task: Task) => ReactNode;
}

/** Kanban board; on narrow screens the columns scroll sideways, one screen-width each. */
export default function TaskBoard({ tasks, columns, renderTask }: TaskBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.column_id === column.id);
        return (
          <section
            key={column.id}
            aria-labelledby={`task-column-${column.id}`}
            className="flex w-[85%] shrink-0 snap-start flex-col gap-2 rounded-lg bg-muted/50 p-2 sm:w-72"
          >
            <h2
              id={`task-column-${column.id}`}
              className="flex items-center gap-2 px-1 text-sm font-semibold"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: column.color }}
                aria-hidden
              />
              <span className="truncate">{column.name}</span>
              <span className="font-normal text-muted-foreground">({columnTasks.length})</span>
              {column.is_done && <span className="sr-only">— {t("tasks.columns.done")}</span>}
            </h2>
            {columnTasks.map((task) => (
              <div key={task.id}>{renderTask(task)}</div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
