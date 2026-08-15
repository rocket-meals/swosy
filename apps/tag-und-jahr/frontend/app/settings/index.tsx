import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Canteen, fetchCanteensAsync, fetchTodaysMealsAsync, Meal } from '../../helpers/foodApi';
import { FOOD_SERVERS, FoodServer, FoodServerKey, getFoodServer } from '../../helpers/foodServers';
import { loadFoodWidgetSettingsAsync, saveFoodWidgetSettingsAsync } from '../../helpers/foodWidgetSettings';
import { CLOCK_COLORS } from '../../helpers/clockDesign';
import { ClockSettings, DEFAULT_CLOCK_SETTINGS, loadClockSettingsAsync, saveClockSettingsAsync } from '../../helpers/clockSettings';
import { syncFoodWidgetTimelineAsync, syncWidgetTimeline } from '../../helpers/widgetSync';
import { ClockWidgetPreview, FoodWidgetPreview } from '../../components/WidgetPreview';

const MEAL_COUNT_OPTIONS = [2, 4, 6, 8];

/** Confirmation shown after the food widget was refreshed. */
function describeFoodSyncStatus(mealCount: number, canteenAlias: string): string {
	if (mealCount === 0) return `Gespeichert - heute keine Speisen für ${canteenAlias}.`;
	return `Gespeichert - ${mealCount} Speisen für ${canteenAlias} ans Widget übergeben.`;
}

/**
 * Fetch today's meals, persist the food widget settings and hand the meals to
 * the widget timeline. Returns `null` as soon as `isCancelled` reports the
 * effect was superseded, so a stale configuration is never announced or saved.
 */
async function loadAndSyncFoodWidget(params: {
	server: FoodServer;
	canteenId: string;
	canteenAlias: string;
	mealCount: number;
	isCancelled: () => boolean;
	onMealsLoaded: (meals: Meal[]) => void;
}): Promise<{ status: string } | { error: string } | null> {
	const { server, canteenId, canteenAlias, mealCount, isCancelled, onMealsLoaded } = params;
	try {
		const todaysMeals = await fetchTodaysMealsAsync(server.serverUrl, canteenId);
		if (isCancelled()) return null;
		onMealsLoaded(todaysMeals);
		const settings = { serverKey: server.key, canteenId, canteenAlias, mealCount };
		await saveFoodWidgetSettingsAsync(settings);
		await syncFoodWidgetTimelineAsync(settings, todaysMeals);
		return isCancelled() ? null : { status: describeFoodSyncStatus(todaysMeals.length, canteenAlias) };
	} catch (err) {
		return isCancelled() ? null : { error: `Speisen konnten nicht geladen werden: ${(err as Error).message}` };
	}
}

// Experimental playground. Everything auto-saves: changing an option persists
// it immediately and refreshes the matching home screen widget - there is no
// explicit save button. The preview at the top mirrors the selected widget,
// and only the settings of the selected widget are shown below it.
export default function Settings() {
	const { width } = useWindowDimensions();
	const [previewKind, setPreviewKind] = useState<'clock' | 'food'>('clock');
	const [clockSettings, setClockSettings] = useState<ClockSettings>(DEFAULT_CLOCK_SETTINGS);
	const [serverKey, setServerKey] = useState<FoodServerKey | null>(null);
	const [canteens, setCanteens] = useState<Canteen[]>([]);
	const [canteensLoading, setCanteensLoading] = useState(false);
	const [canteenId, setCanteenId] = useState<string | null>(null);
	const [mealCount, setMealCount] = useState(4);
	const [meals, setMeals] = useState<Meal[] | null>(null);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Canteen alias from the stored settings, so auto-save works before the
	// canteen list has loaded.
	const storedCanteenAliasRef = useRef<string | null>(null);

	// Hydrate persisted settings once.
	useEffect(() => {
		loadClockSettingsAsync().then(setClockSettings);
		loadFoodWidgetSettingsAsync().then((stored) => {
			if (stored) {
				storedCanteenAliasRef.current = stored.canteenAlias;
				setServerKey(stored.serverKey);
				setCanteenId(stored.canteenId);
				setMealCount(stored.mealCount);
			}
		});
	}, []);

	// Persist a clock display option and refresh the clock widget right away.
	const updateClockSettings = useCallback((update: Partial<ClockSettings>) => {
		setClockSettings((previous) => {
			const next = { ...previous, ...update };
			saveClockSettingsAsync(next).catch((err) => console.warn('[settings] saving clock settings failed:', err));
			syncWidgetTimeline(next);
			return next;
		});
	}, []);

	// Load the canteens of the selected server (no cache - "einfach laden").
	useEffect(() => {
		const server = getFoodServer(serverKey ?? undefined);
		if (!server) {
			return;
		}
		let cancelled = false;
		setCanteensLoading(true);
		setError(null);
		setCanteens([]);
		fetchCanteensAsync(server.serverUrl)
			.then((loaded) => {
				if (!cancelled) {
					setCanteens(loaded);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(`Mensen konnten nicht geladen werden: ${err.message}`);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setCanteensLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [serverKey]);

	// Auto-save + widget refresh whenever the food widget configuration is
	// complete or changes: fetch today's meals (feeds the preview) and push
	// them into the widget timeline.
	useEffect(() => {
		const server = getFoodServer(serverKey ?? undefined);
		if (!server || !canteenId) {
			return;
		}
		const canteenAlias =
			canteens.find((entry) => entry.id === canteenId)?.alias ?? storedCanteenAliasRef.current ?? canteenId;
		let cancelled = false;
		setBusy(true);
		setError(null);
		void (async () => {
			const result = await loadAndSyncFoodWidget({
				server,
				canteenId,
				canteenAlias,
				mealCount,
				isCancelled: () => cancelled,
				onMealsLoaded: (loadedMeals) => {
					setMeals(loadedMeals);
					storedCanteenAliasRef.current = canteenAlias;
				},
			});
			if (!result) return;
			if ('error' in result) {
				setError(result.error);
			} else {
				setStatus(result.status);
			}
			setBusy(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [serverKey, canteenId, mealCount, canteens]);

	const previewSize = Math.min(width - 40, 329);

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.heading}>Widget</Text>
			<View style={styles.chipRow}>
				<Chip label="Kalender" selected={previewKind === 'clock'} onPress={() => setPreviewKind('clock')} />
				<Chip label="Food-Widget" selected={previewKind === 'food'} onPress={() => setPreviewKind('food')} />
			</View>
			<View style={styles.previewContainer}>
				{previewKind === 'clock' ? (
					<ClockWidgetPreview size={previewSize} settings={clockSettings} />
				) : (
					<FoodWidgetPreview size={previewSize} meals={meals ?? []} mealsPerPage={mealCount} />
				)}
			</View>
			<Text style={styles.hint}>
				Vorschau mit den aktuellen Einstellungen - Änderungen speichern automatisch und aktualisieren das Home-Widget sofort.
				{previewKind === 'food'
					? ' Das Food-Widget blättert hier live alle 10 Sekunden; auf dem Home-Bildschirm bietet die Timeline iOS denselben Takt an, das System darf Wechsel aber zusammenfassen.'
					: ''}
			</Text>

			{previewKind === 'clock' ? (
				<>
					<Text style={styles.sectionTitle}>Jahresbeginn (oben)</Text>
					<View style={styles.chipRow}>
						<Chip
							label="Frühling (21.03.)"
							selected={clockSettings.yearStart === 'spring'}
							onPress={() => updateClockSettings({ yearStart: 'spring' })}
						/>
						<Chip
							label="Neujahr (01.01.)"
							selected={clockSettings.yearStart === 'newyear'}
							onPress={() => updateClockSettings({ yearStart: 'newyear' })}
						/>
					</View>

					<Text style={styles.sectionTitle}>Tagesanzeige</Text>
					<View style={styles.chipRow}>
						<Chip
							label="Tagesfortschritt"
							selected={clockSettings.dayDisplay === 'progress'}
							onPress={() => updateClockSettings({ dayDisplay: 'progress' })}
						/>
						<Chip
							label="Sonne & Mond"
							selected={clockSettings.dayDisplay === 'sunmoon'}
							onPress={() => updateClockSettings({ dayDisplay: 'sunmoon' })}
						/>
					</View>
					{clockSettings.dayDisplay === 'sunmoon' ? (
						<Text style={styles.hint}>
							Sonne und Mond wandern über den Horizont: Sonne von 06:00 (links) bis 18:00 (rechts), der Mond übernimmt die Nacht.
							Darüber Himmel, darunter Erde.
						</Text>
					) : null}
				</>
			) : (
				<>
					<Text style={styles.sectionTitle}>Server</Text>
					<View style={styles.chipRow}>
						{FOOD_SERVERS.map((server) => (
							<Chip
								key={server.key}
								label={server.label}
								selected={server.key === serverKey}
								onPress={() => {
									setServerKey(server.key);
									setCanteenId(null);
									setMeals(null);
									setStatus(null);
								}}
							/>
						))}
					</View>

					<Text style={styles.sectionTitle}>Mensa</Text>
					{canteensLoading ? <ActivityIndicator color={CLOCK_COLORS.yearDisc} /> : null}
					{!canteensLoading && serverKey == null ? <Text style={styles.hint}>Zuerst einen Server wählen.</Text> : null}
					<View style={styles.chipRow}>
						{canteens.map((canteen) => (
							<Chip
								key={canteen.id}
								label={canteen.alias}
								selected={canteen.id === canteenId}
								onPress={() => {
									setCanteenId(canteen.id);
									setStatus(null);
								}}
							/>
						))}
					</View>

					<Text style={styles.sectionTitle}>Bilder pro Seite</Text>
					<View style={styles.chipRow}>
						{MEAL_COUNT_OPTIONS.map((count) => (
							<Chip key={count} label={`${count}`} selected={count === mealCount} onPress={() => setMealCount(count)} />
						))}
					</View>

					{busy ? <ActivityIndicator style={styles.busyIndicator} color={CLOCK_COLORS.dayDot} /> : null}
					{status ? <Text style={styles.status}>{status}</Text> : null}
					{error ? <Text style={styles.error}>{error}</Text> : null}

					<Text style={styles.hint}>
						Widget hinzufügen: Home-Bildschirm lange drücken → Bearbeiten → Widget hinzufügen → „Tag und Jahr" → „Speisen heute".
					</Text>
				</>
			)}
		</ScrollView>
	);
}

function Chip({ label, selected, onPress }: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
	return (
		<Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
			<Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: CLOCK_COLORS.background,
	},
	content: {
		padding: 20,
		paddingBottom: 48,
	},
	heading: {
		color: '#e8ebf1',
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 8,
	},
	previewContainer: {
		marginTop: 12,
		marginBottom: 4,
	},
	hint: {
		color: '#c8cfdc',
		fontSize: 13,
		lineHeight: 19,
		marginBottom: 8,
	},
	sectionTitle: {
		color: CLOCK_COLORS.yearDisc,
		fontSize: 14,
		fontWeight: '600',
		marginTop: 16,
		marginBottom: 8,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 18,
		backgroundColor: 'rgba(255,255,255,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.15)',
	},
	chipSelected: {
		backgroundColor: CLOCK_COLORS.yearDisc,
		borderColor: CLOCK_COLORS.yearDisc,
	},
	chipText: {
		color: '#e8ebf1',
		fontSize: 13,
	},
	chipTextSelected: {
		color: '#2b2b28',
		fontWeight: '600',
	},
	busyIndicator: {
		marginTop: 16,
		alignSelf: 'flex-start',
	},
	status: {
		color: '#9fe3b0',
		fontSize: 13,
		marginTop: 12,
	},
	error: {
		color: '#f2a9a0',
		fontSize: 13,
		marginTop: 12,
	},
});
