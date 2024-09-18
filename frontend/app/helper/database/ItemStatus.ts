import {useShowItemsWithEveryStatusState} from "@/states/ShowItemWithStatusState";

export enum ItemStatus {
	PUBLISHED = "published",
	DRAFT = "draft",
	ARCHIVED = "archived",
}

export type ItemWithFieldStatus = {
	status?: string | null;
}

export class ItemStatusFilter {
	static useFilterRecordByItemStatus<T extends ItemWithFieldStatus>(dict: Record<string, T | null | undefined> | null | undefined): Record<string, T | null | undefined> | null | undefined {
		const [showItemsWithEveryStatus, setShowItemsWithEveryStatus] = useShowItemsWithEveryStatusState()

		return ItemStatusFilter.filterRecordByItemStatus(dict, ItemStatus.PUBLISHED, !!showItemsWithEveryStatus);
	}

	private static filterRecordByItemStatus<T extends ItemWithFieldStatus>(dict: Record<string, T | null | undefined> | null | undefined, itemStatus: ItemStatus, ignoreFilter: boolean): Record<string, T | null | undefined> | null | undefined {
		if(ignoreFilter){
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