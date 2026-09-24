/** Ids in their current order with the item at `index` swapped with its neighbour at `delta`. */
export function moveId(ids: number[], index: number, delta: -1 | 1): number[] {
  const target = index + delta;
  if (target < 0 || target >= ids.length) return ids;
  const reordered = [...ids];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}
