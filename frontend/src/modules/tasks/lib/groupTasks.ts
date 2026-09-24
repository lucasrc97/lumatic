import { addDays, format, parseISO } from "date-fns";

import type { Task } from "../types/task";

export const TASK_GROUPS = ["overdue", "today", "tomorrow", "upcoming", "noDate", "completed"] as const;
export type TaskGroup = (typeof TASK_GROUPS)[number];

function groupOf(task: Task, today: string, tomorrow: string): TaskGroup {
  if (task.completed_at !== null) return "completed";
  if (task.due_date === null) return "noDate";
  // `yyyy-MM-dd` strings sort like the dates they represent.
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (task.due_date === tomorrow) return "tomorrow";
  return "upcoming";
}

/**
 * Tasks grouped by due date relative to `today` (`yyyy-MM-dd`), keeping the given order
 * inside each group; completed tasks go last, most recently completed first.
 * Empty groups are omitted.
 */
export function groupTasksByDate(
  tasks: Task[],
  today: string,
): { group: TaskGroup; tasks: Task[] }[] {
  const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");
  const byGroup = new Map<TaskGroup, Task[]>(TASK_GROUPS.map((group) => [group, []]));
  for (const task of tasks) {
    byGroup.get(groupOf(task, today, tomorrow))?.push(task);
  }
  byGroup.get("completed")?.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return TASK_GROUPS.map((group) => ({ group, tasks: byGroup.get(group) ?? [] })).filter(
    ({ tasks: grouped }) => grouped.length > 0,
  );
}
