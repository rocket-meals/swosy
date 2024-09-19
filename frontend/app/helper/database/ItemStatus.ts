export enum ItemStatus {
	PUBLISHED = "published",
	DRAFT = "draft",
	ARCHIVED = "archived",
}

export type ItemWithFieldStatus = {
	status?: string | null;
}

export class ItemStatusFilter {

	public static filterListByItemStatus<T extends ItemWithFieldStatus>(list: T[], itemStatus: ItemStatus | undefined): T[] {
		// transform list to dict with key = index
		const dict = ItemStatusFilter.transformListToDict(list);
		const filteredDict = ItemStatusFilter.filterRecordByItemStatus(dict, itemStatus);
		return ItemStatusFilter.transformDictToList(filteredDict);
	}

	private static transformListToDict<T>(list: T[]): Record<string, T | null | undefined> {
		const dict: Record<string, T | null | undefined> = {};
		list.forEach((item, index) => {
			dict[index.toString()] = item;
		});
		return dict;
	}

	private static transformDictToList<T>(dict: Record<string, T | null | undefined> | null | undefined): T[] {
		const list: T[] = [];
		if(!!dict){
			Object.keys(dict).forEach((key) => {
				const item = dict[key];
				if (!item) {
					return;
				}
				list.push(item);
			});
		}
		return list;
	}

	public static filterRecordByItemStatus<T extends ItemWithFieldStatus>(dict: Record<string, T | null | undefined>, itemStatus: ItemStatus | undefined): Record<string, T | null | undefined> | null | undefined {
		if(itemStatus === undefined) {
			return dict;
		}

		if (!dict) {
			return null;
		}
		const filteredDict: Record<string, T | null | undefined> = {};
		Object.keys(dict).forEach((key) => {
			const item = dict[key];
			if (!item) {
				return;
			}
			if (item.status === itemStatus) {
				filteredDict[key] = item;
			}
		});
		return filteredDict;
	}
}