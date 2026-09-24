import type { TrashItem } from "../types/trash";

/** Section order for known modules; unknown modules follow alphabetically. */
const MODULE_ORDER = ["habits", "tasks", "events"];

function rank(module: string): number {
  const index = MODULE_ORDER.indexOf(module);
  return index === -1 ? MODULE_ORDER.length : index;
}

/** Items grouped by owning module, keeping the given order inside each group. */
export function groupByModule(items: TrashItem[]): { module: string; items: TrashItem[] }[] {
  const groups = new Map<string, TrashItem[]>();
  for (const item of items) {
    const group = groups.get(item.module) ?? [];
    group.push(item);
    groups.set(item.module, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([module, grouped]) => ({ module, items: grouped }));
}
