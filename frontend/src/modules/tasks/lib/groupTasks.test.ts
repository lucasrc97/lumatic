import { describe, expect, it } from "vitest";

import type { Task } from "../types/task";
import { groupTasksByDate } from "./groupTasks";

function task(id: number, due_date: string | null, completed_at: string | null = null): Task {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    due_date,
    column_id: 1,
    priority: "none",
    completed_at,
    created_at: "2026-09-01T00:00:00Z",
  };
}

describe("groupTasksByDate", () => {
  it("groups by due date relative to today and puts completed tasks last", () => {
    const tasks = [
      task(1, "2026-09-20"),
      task(2, "2026-09-24"),
      task(3, "2026-09-25"),
      task(4, "2026-10-10"),
      task(5, null),
      task(6, "2026-09-20", "2026-09-21T10:00:00Z"),
      task(7, null, "2026-09-23T10:00:00Z"),
    ];

    const groups = groupTasksByDate(tasks, "2026-09-24");

    expect(groups.map(({ group, tasks: grouped }) => [group, grouped.map((t) => t.id)])).toEqual([
      ["overdue", [1]],
      ["today", [2]],
      ["tomorrow", [3]],
      ["upcoming", [4]],
      ["noDate", [5]],
      ["completed", [7, 6]],
    ]);
  });

  it("handles month boundaries for tomorrow and omits empty groups", () => {
    const groups = groupTasksByDate([task(1, "2026-10-01")], "2026-09-30");

    expect(groups).toEqual([{ group: "tomorrow", tasks: [task(1, "2026-10-01")] }]);
  });
});
