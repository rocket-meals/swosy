import { Platform } from 'react-native';

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
export function getTimelineEntryDates(now: Date): Date[] {
	const stepMs = TIMELINE_STEP_MINUTES * 60 * 1000;
	const firstEntry = Math.floor(now.getTime() / stepMs) * stepMs;
	const lastEntry = now.getTime() + TIMELINE_DAYS * 24 * 60 * 60 * 1000;
	const dates: Date[] = [];
	for (let time = firstEntry; time <= lastEntry; time += stepMs) {
		dates.push(new Date(time));
	}
	return dates;
}

/**
 * Registers the widget and schedules its timeline. iOS only - on Android and
 * web this is a no-op (expo-widgets ships stubs, but the widget layout uses
 * @expo/ui/swift-ui, which only exists on iOS, so the module stays unloaded).
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
