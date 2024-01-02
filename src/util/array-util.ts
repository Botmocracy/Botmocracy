export function formatArrayValuesAsHumanReadableString(
  array: unknown[],
): string {
  const result = array;
  if (result.length > 1) result.splice(array.length - 1, 0, "and");
  return result.join(", ").replace(", and,", " and");
}

export function getNextNonEmptyIndex(
  array: (unknown | null)[],
  startPoint: number,
): number | null {
  for (const [i, ele] of array.entries()) {
    if (i <= startPoint) continue;
    if (ele != null || !Array.isArray(ele)) continue;
    if ((ele as unknown[]).length != 0) return i;
  }
  return null;
}
