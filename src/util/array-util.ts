export function formatArrayValuesAsHumanReadableString(
  array: unknown[],
): string {
  const result = array;
  if (result.length > 1) result.splice(array.length - 1, 0, "and");
  return result.join(", ").replace(", and,", " and");
}

export function getNextNonEmptyIndex(
  array: (unknown | null)[],
  startPoint: string,
): number | null {
  for (const i in array) {
    if (
      parseInt(i) > parseInt(startPoint) &&
      array[i] != null &&
      array instanceof Array &&
      array.length > 0
    )
      return parseInt(i);
  }
  return null;
}
