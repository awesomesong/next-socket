
export const arraysEqualUnordered = <T>(arr1: T[], arr2: T[]): boolean => {
    if (!arr1) return false;
    if (arr1?.length !== arr2.length) return false;

    return [...arr1].sort().toString() === [...arr2].sort().toString();
};