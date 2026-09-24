import { describe, expect, it } from "vitest";

import type { TrashItem } from "../types/trash";
import { groupByModule } from "./groupByModule";

function item(module: string, id: number): TrashItem {
  return {
    module,
    id,
    title: `${module} ${id}`,
    deleted_at: "2026-09-20T10:00:00Z",
    purge_at: "2026-10-20T10:00:00Z",
  };
}

describe("groupByModule", () => {
  it("groups items by module in a fixed module order, keeping item order", () => {
    const groups = groupByModule([
      item("tasks", 1),
      item("zeta", 9),
      item("habits", 2),
      item("events", 3),
      item("tasks", 4),
    ]);

    expect(groups.map(({ module, items }) => [module, items.map((i) => i.id)])).toEqual([
      ["habits", [2]],
      ["tasks", [1, 4]],
      ["events", [3]],
      ["zeta", [9]],
    ]);
  });
});
