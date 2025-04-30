import { CollectionsDatesLastUpdate } from '@/constants/types';

export const transformUpdateDatesToMap = (
  array: CollectionsDatesLastUpdate[]
): Record<string, string> => {
  const map: Record<string, string> = {};
  array.forEach((item) => {
    const updated = item.date_updated ?? item.date_created;
    if (updated) {
      map[item.id] = updated;
    }
  });
  return map;
};
