import { useEffect, useMemo, useState } from 'react';
import { useDispatch, shallowEqual } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import useFoodOffersSorter from '@/hooks/useFoodOffersSorter';
import { BusinessHoursHelper } from '@/redux/actions/BusinessHours/BusinessHours';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { getCachedFoodOffers } from '@/helper/FoodOffersCacheHelper';
import { SET_BUSINESS_HOURS } from '@/redux/Types/types';
import { CourseTimetableEvent, CourseTimetableWeekday, timeToMinutes } from '@/helper/courseTimetable/CourseTimetableModel';
import { BusinessHoursLike, MinuteRange, findLunchBreak, getOpeningRangesForDate } from '@/helper/courseTimetable/LunchBreakHelper';

export type LunchSuggestion = {
	/** Suggested break, minutes since midnight. */
	start: number;
	end: number;
	/** The canteen's opening ranges that day (shown instead of the canteen name). */
	openingRanges: MinuteRange[];
	/** The food offer that fits the user best (first after the food offers screen's sort). */
	food: DatabaseTypes.Foodoffers;
};

export type LunchSuggestionDay = {
	dateString: string;
	weekday: CourseTimetableWeekday;
	events: CourseTimetableEvent[];
};

type JunctionRow = { businesshours_id?: string | { id?: string } | null };

function junctionIds(rows: unknown): string[] {
	if (!Array.isArray(rows)) return [];
	return rows
		.map((row: JunctionRow | string) => {
			if (typeof row === 'string') return row;
			const value = row?.businesshours_id;
			if (typeof value === 'string') return value;
			return value?.id ?? null;
		})
		.filter((id): id is string => typeof id === 'string');
}

// Food offers per canteen/date/language for this app session – switching between day and
// week view must not refetch.
const foodOffersSessionCache: Record<string, DatabaseTypes.Foodoffers[]> = {};

async function loadFoodOffers(canteenId: string, dateString: string, languageCode: string): Promise<DatabaseTypes.Foodoffers[]> {
	const key = `${canteenId}_${dateString}_${languageCode}`;
	const inSession = foodOffersSessionCache[key];
	if (inSession) return inSession;
	const cached = await getCachedFoodOffers(canteenId, dateString);
	if (cached && cached.offers.length > 0) {
		foodOffersSessionCache[key] = cached.offers;
		return cached.offers;
	}
	const response = await fetchFoodOffersByCanteen(canteenId, dateString, languageCode);
	const offers = (response?.data || []) as DatabaseTypes.Foodoffers[];
	foodOffersSessionCache[key] = offers;
	return offers;
}

/**
 * Lunch break suggestions for the given days, keyed by date (`null` = no suggestion).
 * See `LunchBreakHelper` for the rules; this hook supplies the canteen's opening hours, the
 * day's food offers and the user's food sort.
 */
export default function useCourseTimetableLunchSuggestions(days: LunchSuggestionDay[]): Record<string, LunchSuggestion | null> {
	const dispatch = useDispatch();
	const canteen = useSelectedCanteen() as (DatabaseTypes.Canteens & { foodservice_hours?: unknown }) | null;
	const businessHours = useAppSelector(state => state.canteenReducer.businessHours, shallowEqual) as (DatabaseTypes.Businesshours & BusinessHoursLike)[];
	const buildingsDict = useAppSelector(state => state.canteenReducer.buildingsDict, shallowEqual) as Record<string, DatabaseTypes.Buildings>;
	const language = useAppSelector(state => state.settings.language);
	const sortOffers = useFoodOffersSorter();
	const [suggestions, setSuggestions] = useState<Record<string, LunchSuggestion | null>>({});

	// The food offers screen loads all business hours; the timetable may be opened first.
	useEffect(() => {
		if (businessHours && businessHours.length > 0) return;
		let cancelled = false;
		new BusinessHoursHelper()
			.fetchBusinessHours({})
			.then(rows => {
				if (!cancelled) dispatch({ type: SET_BUSINESS_HOURS, payload: rows });
			})
			.catch(error => console.error('Course timetable: could not load business hours', error));
		return () => {
			cancelled = true;
		};
	}, [businessHours, dispatch]);

	const canteenHours = useMemo(() => {
		if (!canteen) return [];
		const byId = new Map((businessHours || []).map(row => [String(row.id), row]));
		// Food service hours describe when food is served – exactly what a lunch break needs.
		// Canteens without them fall back to the opening hours of their building.
		let ids = junctionIds(canteen.foodservice_hours);
		if (ids.length === 0) {
			const buildingId = typeof canteen.building === 'object' ? canteen.building?.id : canteen.building;
			const building = buildingId ? buildingsDict?.[String(buildingId)] : undefined;
			ids = junctionIds(building?.businesshours);
		}
		return ids.map(id => byId.get(id)).filter((row): row is DatabaseTypes.Businesshours & BusinessHoursLike => !!row);
	}, [canteen, businessHours, buildingsDict]);

	// A stable key so the effect only reruns when the days or their events really change.
	const daysKey = useMemo(() => days.map(day => `${day.dateString}:${day.events.map(e => `${e.start}-${e.end}`).join(',')}`).join('|'), [days]);

	useEffect(() => {
		const canteenId = canteen?.id;
		if (!canteenId || canteenHours.length === 0) {
			setSuggestions({});
			return;
		}
		let cancelled = false;
		const run = async () => {
			const result: Record<string, LunchSuggestion | null> = {};
			await Promise.all(
				days.map(async day => {
					const openingRanges = getOpeningRangesForDate(canteenHours, day.dateString, day.weekday);
					const busy = day.events.map(event => ({ start: timeToMinutes(event.start), end: timeToMinutes(event.end) }));
					const lunch = findLunchBreak(openingRanges, busy);
					if (!lunch) {
						result[day.dateString] = null;
						return;
					}
					try {
						const offers = await loadFoodOffers(canteenId, day.dateString, language);
						if (offers.length === 0) {
							result[day.dateString] = null;
							return;
						}
						const best = sortOffers(offers)[0];
						result[day.dateString] = best ? { ...lunch, openingRanges, food: best } : null;
					} catch (error) {
						console.error('Course timetable: could not load food offers', error);
						result[day.dateString] = null;
					}
				})
			);
			if (!cancelled) setSuggestions(result);
		};
		run();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [daysKey, canteen?.id, canteenHours, language, sortOffers]);

	return suggestions;
}
