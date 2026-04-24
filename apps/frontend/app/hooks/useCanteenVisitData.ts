import { useCallback, useEffect, useState } from 'react';
import { DatabaseTypes } from 'repo-depkit-common';
import { CanteenVisitsHelper } from '@/redux/actions/CanteenVisits/CanteenVisits';

const canteenVisitsHelper = new CanteenVisitsHelper();

export type CanteenVisitsVisibility = 'all' | 'friends_only' | 'public_only' | 'off';

interface UseCanteenVisitDataOptions {
	canteenId: string;
	date: string;
	profileId: string | undefined;
	friendProfileIds: string[];
	isRegistered: boolean;
	visibility?: CanteenVisitsVisibility;
	enabled?: boolean;
	initialCounts?: { total: number; friends: number };
}

const useCanteenVisitData = ({
	canteenId,
	date,
	profileId,
	friendProfileIds,
	isRegistered,
	visibility = 'all',
	enabled = true,
	initialCounts,
}: UseCanteenVisitDataOptions) => {
	const [counts, setCounts] = useState(initialCounts ?? { total: 0, friends: 0 });
	const [ownVisit, setOwnVisit] = useState<DatabaseTypes.CanteenVisits | null | undefined>(undefined);

	const fetchData = useCallback(async () => {
		if (!canteenId || !enabled || visibility === 'off') return;

		const shouldFetchTotal = visibility === 'all' || visibility === 'public_only';
		const shouldFetchFriends = (visibility === 'all' || visibility === 'friends_only') && friendProfileIds.length > 0;
		const shouldFetchOwn = isRegistered && !!profileId;

		const [total, friends, own] = await Promise.all([
			shouldFetchTotal
				? canteenVisitsHelper.fetchVisitCountForDate(canteenId, date)
				: Promise.resolve(0),
			shouldFetchFriends
				? canteenVisitsHelper.fetchFriendVisitCountForDate(canteenId, date, friendProfileIds)
				: Promise.resolve(0),
			shouldFetchOwn
				? canteenVisitsHelper.fetchOwnVisitForDate(canteenId, date, profileId!)
				: Promise.resolve(null),
		]);

		setCounts({ total, friends });
		setOwnVisit(own);
	}, [canteenId, date, friendProfileIds, isRegistered, profileId, visibility, enabled]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { counts, ownVisit, setOwnVisit, fetchData };
};

export default useCanteenVisitData;
