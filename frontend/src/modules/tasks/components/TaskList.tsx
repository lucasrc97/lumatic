import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { groupTasksByDate } from "../lib/groupTasks";
import type { Task } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  /** `yyyy-MM-dd`. */
  today: string;
  renderTask: (task: Task) => ReactNode;
}

/** Tasks grouped by due date: overdue, today, tomorrow, upcoming, undated, completed. */
export default function TaskList({ tasks, today, renderTask }: TaskListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {groupTasksByDate(tasks, today).map(({ group, tasks: grouped }) => (
        <section key={group} aria-labelledby={`task-group-${group}`} className="space-y-2">
          <h2 id={`task-group-${group}`} className="text-sm font-semibold text-muted-foreground">
            {t(`tasks.groups.${group}`)} <span className="font-normal">({grouped.length})</span>
          </h2>
          <div className="grid gap-2 lg:grid-cols-2">
            {grouped.map((task) => (
              <div key={task.id}>{renderTask(task)}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
