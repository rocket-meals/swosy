export const shouldFetch = (
  key: string,
  serverMap: Record<string, string>,
  localMap: Record<string, string>
): boolean => {
  const serverDate = new Date(serverMap[key]);
  const localDate = localMap[key] ? new Date(localMap[key]) : null;

  // If no local date exists, it's the first time => fetch
  if (!localDate) return true;

  // If server has newer data => fetch
  return serverDate > localDate;
};
