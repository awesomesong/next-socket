type Item = { [key: string]: unknown };

export const prioritizeArray = <T extends Item>(arr: T[], key: keyof T, value: T[keyof T]): T[] => {
  const matched = arr?.filter(item => item[key] === value);
  const others = arr?.filter(item => item[key] !== value);
  return matched ? [...matched, ...others] : [];
};