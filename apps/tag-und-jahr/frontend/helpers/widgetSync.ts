import { Platform } from 'react-native';
import { ClockSettings, DEFAULT_CLOCK_SETTINGS } from './clockSettings';
import { fetchTodaysMealsAsync, Meal, paginateMeals } from './foodApi';
import { getFoodServer } from './foodServers';
import { FoodWidgetSettings, loadFoodWidgetSettingsAsync } from './foodWidgetSettings';

// WidgetKit does not guarantee minute-precise rendering. The clock widget
// schedules states every 30 minutes; iOS decides when it actually renders
// them. For a contemplative object this fuzziness is acceptable.
export const TIMELINE_STEP_MINUTES = 30;

// How far into the future the clock timeline reaches. After that the widget
// shows its last state until the app is opened again (the timeline is
// refreshed on every app start and foreground activation).
export const TIMELINE_DAYS = 7;

// Auto-pagination of the food widget: the timeline advances to the next page
// every 10 seconds for the first 15 minutes after a sync, then once per
// minute for three hours, then every 30 minutes until the end of the day.
// The tapering keeps the total entry count around ~300 - the widget
// extension parses the WHOLE stored timeline on every reload, and thousands
// of entries can blow its tight memory/time budget (blank/black widget).
// NOTE: WidgetKit treats entry dates as the EARLIEST render moment and may
// coalesce sub-minute entries depending on system budget - the timeline
// offers the 10s cadence, iOS decides how closely it follows it.
export const FOOD_FAST_STEP_SECONDS = 10;
export const FOOD_FAST_WINDOW_MINUTES = 15;
export const FOOD_SLOW_STEP_SECONDS = 60;
export const FOOD_SLOW_WINDOW_MINUTES = 180;
export const FOOD_TAIL_STEP_SECONDS = 30 * 60;

/**
 * The dates of all clock timeline entries: every half hour boundary from the
 * most recent one until TIMELINE_DAYS from now. Pure function for testability.
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
 * The dates of the food widget timeline entries: 10-second steps for the
 * first hour, one-minute steps afterwards, all capped at the end of today.
 * Pure function for testability.
 */
export function getFoodTimelineEntryDates(now: Date): Date[] {
	const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
	const fastUntil = Math.min(now.getTime() + FOOD_FAST_WINDOW_MINUTES * 60 * 1000, endOfDay);
	const slowUntil = Math.min(fastUntil + FOOD_SLOW_WINDOW_MINUTES * 60 * 1000, endOfDay);
	const dates: Date[] = [];
	for (let time = now.getTime(); time < fastUntil; time += FOOD_FAST_STEP_SECONDS * 1000) {
		dates.push(new Date(time));
	}
	for (let time = fastUntil; time < slowUntil; time += FOOD_SLOW_STEP_SECONDS * 1000) {
		dates.push(new Date(time));
	}
	for (let time = slowUntil; time < endOfDay; time += FOOD_TAIL_STEP_SECONDS * 1000) {
		dates.push(new Date(time));
	}
	return dates;
}

/**
 * Registers the year clock widget and schedules its timeline with the given
 * display options as props (the widget cannot read the app storage itself).
 * iOS only - on Android and web this is a no-op (expo-widgets ships stubs,
 * but the widget layout uses @expo/ui/swift-ui, which only exists on iOS,
 * so the module stays unloaded).
 */
export function syncWidgetTimeline(clockSettings: ClockSettings = DEFAULT_CLOCK_SETTINGS, now: Date = new Date()): void {
	if (Platform.OS !== 'ios') {
		return;
	}
	// Lazy require: importing the widget module calls createWidget, which
	// registers the layout with the native ExpoWidgets module.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const widget = require('../widgets/TagUndJahrWidget').default;
	// Time derives from the entry date; the props carry the display options.
	const props = { yearStart: clockSettings.yearStart, dayDisplay: clockSettings.dayDisplay };
	widget.updateTimeline(getTimelineEntryDates(now).map((date) => ({ date, props })));
}

/**
 * Downloads the meal photos into the shared app group container
 * (widgetsDirectory) so the widget extension can read them - widgets cannot
 * load network images themselves. Returns the meals with local file paths.
 * Failures are per-image and non-fatal: the widget then shows a placeholder
 * tile for that meal.
 */
async function downloadMealImagesAsync(meals: Meal[]): Promise<Meal[]> {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { widgetsDirectory } = require('expo-widgets');
	if (!widgetsDirectory) {
		return meals;
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const FileSystem = require('expo-file-system/legacy');
	const baseDirectory = widgetsDirectory.endsWith('/') ? widgetsDirectory : `${widgetsDirectory}/`;
	return await Promise.all(
		meals.map(async (meal, index) => {
			if (!meal.imageUrl) {
				return meal;
			}
			try {
				const target = `${baseDirectory}food-widget-meal-${index}.jpg`;
				const result = await FileSystem.downloadAsync(meal.imageUrl, target);
				if (result.status !== 200) {
					return meal;
				}
				return { ...meal, imagePath: result.uri };
			} catch (error) {
				console.warn(`[widgetSync] photo download failed for ${meal.name}:`, error);
				return meal;
			}
		})
	);
}

/**
 * Schedules the food widget timeline from already fetched meals: a pure photo
 * grid, auto-paginating through the pages (WidgetKit cannot swipe). The
 * timeline only covers today - tomorrow's menu is unknown until the app runs
 * again.
 */
export async function syncFoodWidgetTimelineAsync(settings: FoodWidgetSettings, rawMeals: Meal[], now: Date = new Date()): Promise<void> {
	if (Platform.OS !== 'ios') {
		return;
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const widget = require('../widgets/FoodWidget').default;
	const meals = await downloadMealImagesAsync(rawMeals);

	const pages = paginateMeals(meals, settings.mealCount);
	if (pages.length === 0) {
		widget.updateSnapshot({ meals: [] });
		return;
	}

	widget.updateTimeline(
		getFoodTimelineEntryDates(now).map((date, index) => ({
			date,
			props: { meals: pages[index % pages.length] },
		}))
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
		await syncFoodWidgetTimelineAsync(settings, meals);
	} catch (error) {
		console.warn('[widgetSync] food widget refresh failed:', error);
	}
}
