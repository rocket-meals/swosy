import {useSyncState} from '@/helper/syncState/SyncState';

export enum SortType {
	none = 'none',
	alphabetical = 'alphabetical',
	favorite = 'favorite',
	intelligent = 'intelligent',
	eatingHabits = 'eatingHabits',
}

export const sortTypesForFood = [SortType.intelligent, SortType.favorite, SortType.eatingHabits, SortType.alphabetical, SortType.none]

export function useSynchedSortType(
	synchKey: string
): [SortType, ((newValue: SortType | null) => Promise<(boolean | void)>)] {
	const [resourcesRaw, setResourcesRaw] = useSyncState<SortType>(synchKey);
	const usedFirstWeekday = resourcesRaw || SortType.intelligent

	return [usedFirstWeekday, setResourcesRaw]
}