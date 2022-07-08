export function formatArrayValuesAsHumanReadableString(array: Array<unknown>): string {
    let result = array;
    if (result.length > 1) result.splice(array.length - 1, 0, "and");
    return result.join(", ").replace(", and,", " and");
}

export function getNextNonEmptyIndex(array: Array<unknown | null>, startPoint: string): number | null {
    for (let i in array) {
        if (parseInt(i) > parseInt(startPoint) && (array[i] != null && array[i] != [])) return parseInt(i);
    }
    return null;
}