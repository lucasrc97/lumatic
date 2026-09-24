import { cn } from "@/shared/lib/utils";

import { PRIORITY_COLORS } from "../lib/priority";
import type { Task, TaskColumn } from "../types/task";
import PriorityTag from "./PriorityTag";
import TaskActions from "./TaskActions";
import TaskColumnSelect from "./TaskColumnSelect";
import TaskDueDate from "./TaskDueDate";

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

/** A task as a Kanban card; the left border takes the priority color. */
export default function TaskCard({
  task,
  columns,
  today,
  disabled = false,
  onMove,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.completed_at !== null;
  const isOverdue = !isCompleted && task.due_date !== null && task.due_date < today;
  const priorityColor = PRIORITY_COLORS[task.priority];

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
        <div className="-mr-2 -mt-1">
          <TaskActions
            title={task.title}
            disabled={disabled}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      {task.description && (
        <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
          {task.description}
        </p>
      )}

      {(task.due_date || priorityColor) && (
        <div className="flex flex-wrap gap-1">
          <PriorityTag priority={task.priority} />
          {task.due_date && <TaskDueDate dueDate={task.due_date} overdue={isOverdue} />}
        </div>
      )}

      <TaskColumnSelect task={task} columns={columns} disabled={disabled} onMove={onMove} />
    </article>
  );
}
