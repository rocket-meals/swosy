import { Platform } from 'react-native';
import { fetchTodaysMealsAsync, Meal, paginateMeals } from './foodApi';
import { getFoodServer } from './foodServers';
import { FoodWidgetSettings, loadFoodWidgetSettingsAsync } from './foodWidgetSettings';

// WidgetKit does not guarantee minute-precise rendering. The app therefore
// schedules timeline states every 30 minutes; iOS decides when it actually
// renders them. For a contemplative object this fuzziness is acceptable.
export const TIMELINE_STEP_MINUTES = 30;

// How far into the future the timeline reaches. After that the widget shows
// its last state until the app is opened again (the timeline is refreshed on
// every app start and foreground activation).
export const TIMELINE_DAYS = 7;

/**
 * The dates of all timeline entries: every half hour boundary from the most
 * recent one until TIMELINE_DAYS from now. Pure function for testability.
 */
export function getTimelineEntryDates(now: Date, days: number = TIMELINE_DAYS): Date[] {
	const stepMs = TIMELINE_STEP_MINUTES * 60 * 1000;
	const firstEntry = Math.floor(now.getTime() / stepMs) * stepMs;
	const lastEntry = now.getTime() + days * 24 * 60 * 60 * 1000;
	const dates: Date[] = [];
	for (let time = firstEntry; time <= lastEntry; time += stepMs) {
		dates.push(new Date(time));
	}
	return dates;
}

/**
 * Registers the year clock widget and schedules its timeline. iOS only - on
 * Android and web this is a no-op (expo-widgets ships stubs, but the widget
 * layout uses @expo/ui/swift-ui, which only exists on iOS, so the module stays
 * unloaded).
 */
export function syncWidgetTimeline(now: Date = new Date()): void {
	if (Platform.OS !== 'ios') {
		return;
	}
	// Lazy require: importing the widget module calls createWidget, which
	// registers the layout with the native ExpoWidgets module.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const widget = require('../widgets/TagUndJahrWidget').default;
	// The widget derives everything from the entry date, so the props are empty.
	widget.updateTimeline(getTimelineEntryDates(now).map((date) => ({ date, props: {} })));
}

/**
 * Schedules the food widget timeline from already fetched meals. WidgetKit
 * cannot swipe, so when there are more meals than fit on one page the
 * half-hour timeline entries rotate through the pages instead. The timeline
 * only covers today - tomorrow's menu is unknown until the app runs again.
 */
export function syncFoodWidgetTimeline(settings: FoodWidgetSettings, meals: Meal[], now: Date = new Date()): void {
	if (Platform.OS !== 'ios') {
		return;
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const widget = require('../widgets/FoodWidget').default;

	const updatedAt = `${now.getHours()}:${`${now.getMinutes()}`.padStart(2, '0')}`;
	const pages = paginateMeals(meals, settings.mealCount);
	if (pages.length === 0) {
		widget.updateSnapshot({
			title: settings.canteenAlias,
			meals: [],
			footer: `Keine Speisen heute · ${updatedAt}`,
		});
		return;
	}

	// One entry per half hour until end of day, cycling through the pages.
	const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	const entryDates = getTimelineEntryDates(now, 1).filter((date) => date < endOfDay);
	widget.updateTimeline(
		entryDates.map((date, index) => {
			const pageIndex = index % pages.length;
			const pageInfo = pages.length > 1 ? `Seite ${pageIndex + 1}/${pages.length} · ` : '';
			return {
				date,
				props: {
					title: settings.canteenAlias,
					meals: pages[pageIndex],
					footer: `${pageInfo}Stand ${updatedAt}`,
				},
			};
		})
	);
}

/**
 * Loads the stored food widget settings, fetches today's meals and refreshes
 * the widget. Used on app start/foreground; failures only log (playground
 * feature, no user-facing error handling here).
 */
export async function refreshFoodWidgetFromStoredSettingsAsync(): Promise<void> {
	if (Platform.OS !== 'ios') {
		return;
	}
	try {
		const settings = await loadFoodWidgetSettingsAsync();
		const server = getFoodServer(settings?.serverKey);
		if (!settings || !server) {
			return;
		}
		const meals = await fetchTodaysMealsAsync(server.serverUrl, settings.canteenId);
		syncFoodWidgetTimeline(settings, meals);
	} catch (error) {
		console.warn('[widgetSync] food widget refresh failed:', error);
	}
}
