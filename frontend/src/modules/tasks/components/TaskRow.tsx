import { cn } from "@/shared/lib/utils";

import { PRIORITY_COLORS } from "../lib/priority";
import type { Task, TaskColumn } from "../types/task";
import PriorityTag from "./PriorityTag";
import TaskActions from "./TaskActions";
import TaskColumnSelect from "./TaskColumnSelect";
import TaskDueDate from "./TaskDueDate";

interface TaskRowProps {
  task: Task;
  columns: TaskColumn[];
  /** `yyyy-MM-dd`, to flag overdue tasks. */
  today: string;
  disabled?: boolean;
  onMove: (columnId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * A task as one row of the list view: priority color on the left edge and as a tag,
 * then title, due date, column and actions (wrapping onto two lines on narrow screens).
 */
export default function TaskRow({
  task,
  columns,
  today,
  disabled = false,
  onMove,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const isCompleted = task.completed_at !== null;
  const isOverdue = !isCompleted && task.due_date !== null && task.due_date < today;
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <li
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 py-2 pl-3 pr-1"
      // Rows without a priority keep a neutral edge so titles stay aligned.
      style={{ borderLeftColor: priorityColor ?? "hsl(var(--border))" }}
    >
      <span
        className={cn(
          "min-w-0 flex-1 basis-40 break-words font-medium",
          isCompleted && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </span>
      <div className="flex items-center gap-2">
        <PriorityTag priority={task.priority} />
        {task.due_date && <TaskDueDate dueDate={task.due_date} overdue={isOverdue} />}
        <TaskColumnSelect
          task={task}
          columns={columns}
          disabled={disabled}
          onMove={onMove}
          className="w-32"
        />
        <TaskActions title={task.title} disabled={disabled} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </li>
  );
}
