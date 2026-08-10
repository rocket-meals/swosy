import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Canteen, fetchCanteensAsync, fetchTodaysMealsAsync, Meal } from '../../helpers/foodApi';
import { FOOD_SERVERS, FoodServerKey, getFoodServer } from '../../helpers/foodServers';
import { loadFoodWidgetSettingsAsync, saveFoodWidgetSettingsAsync } from '../../helpers/foodWidgetSettings';
import { CLOCK_COLORS } from '../../helpers/clockDesign';
import { ClockSettings, DEFAULT_CLOCK_SETTINGS, loadClockSettingsAsync, saveClockSettingsAsync } from '../../helpers/clockSettings';
import { syncFoodWidgetTimelineAsync, syncWidgetTimeline } from '../../helpers/widgetSync';
import { ClockWidgetPreview, FoodWidgetPreview } from '../../components/WidgetPreview';

const MEAL_COUNT_OPTIONS = [2, 4, 6, 8];

// Experimental playground: pick a Rocket Meals server and canteen, choose how
// many meals the food widget shows at once, then push today's menu into the
// widget timeline. Deliberately no caching - data is fetched fresh on demand.
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

	// Hydrate persisted settings once.
	useEffect(() => {
		loadClockSettingsAsync().then(setClockSettings);
		loadFoodWidgetSettingsAsync().then((stored) => {
			if (stored) {
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

	// Load today's meals for the preview as soon as server and canteen are
	// known (hydrated from storage or freshly picked) - no caching, the
	// preview simply reflects what the widget would show.
	useEffect(() => {
		const server = getFoodServer(serverKey ?? undefined);
		if (!server || !canteenId) {
			return;
		}
		let cancelled = false;
		fetchTodaysMealsAsync(server.serverUrl, canteenId)
			.then((loaded) => {
				if (!cancelled) {
					setMeals(loaded);
				}
			})
			.catch(() => {
				// Preview only - errors surface via the explicit button flow.
			});
		return () => {
			cancelled = true;
		};
	}, [serverKey, canteenId]);

	const applyToWidget = useCallback(async () => {
		const server = getFoodServer(serverKey ?? undefined);
		const canteen = canteens.find((entry) => entry.id === canteenId);
		if (!server || !canteen) {
			setError('Bitte zuerst Server und Mensa wählen.');
			return;
		}
		setBusy(true);
		setError(null);
		setStatus(null);
		try {
			const todaysMeals = await fetchTodaysMealsAsync(server.serverUrl, canteen.id);
			const settings = { serverKey: server.key, canteenId: canteen.id, canteenAlias: canteen.alias, mealCount };
			await saveFoodWidgetSettingsAsync(settings);
			await syncFoodWidgetTimelineAsync(settings, todaysMeals);
			setMeals(todaysMeals);
			setStatus(
				todaysMeals.length === 0
					? `Heute keine Speisen für ${canteen.alias} - Widget zeigt einen Hinweis.`
					: `${todaysMeals.length} Speisen geladen und ans Widget übergeben.`
			);
		} catch (err) {
			setError(`Speisen konnten nicht geladen werden: ${(err as Error).message}`);
		} finally {
			setBusy(false);
		}
	}, [serverKey, canteens, canteenId, mealCount]);

	const previewSize = Math.min(width - 40, 329);

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.heading}>Widget-Vorschau</Text>
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
				So sieht das Widget mit den aktuellen Einstellungen aus. Das Food-Widget blättert hier live alle 10 Sekunden - auf dem
				Home-Bildschirm bietet die Timeline iOS denselben Takt an, das System darf Wechsel aber zusammenfassen.
			</Text>

			<Text style={[styles.heading, styles.headingSpaced]}>Uhr</Text>
			<Text style={styles.sectionTitle}>Jahresbeginn (oben)</Text>
			<View style={styles.chipRow}>
				<Chip label="Frühling (21.03.)" selected={clockSettings.yearStart === 'spring'} onPress={() => updateClockSettings({ yearStart: 'spring' })} />
				<Chip label="Neujahr (01.01.)" selected={clockSettings.yearStart === 'newyear'} onPress={() => updateClockSettings({ yearStart: 'newyear' })} />
			</View>

			<Text style={styles.sectionTitle}>Tagesanzeige</Text>
			<View style={styles.chipRow}>
				<Chip label="Tagesfortschritt" selected={clockSettings.dayDisplay === 'progress'} onPress={() => updateClockSettings({ dayDisplay: 'progress' })} />
				<Chip label="Sonne & Mond" selected={clockSettings.dayDisplay === 'sunmoon'} onPress={() => updateClockSettings({ dayDisplay: 'sunmoon' })} />
			</View>
			{clockSettings.dayDisplay === 'sunmoon' ? (
				<Text style={styles.hint}>
					Sonne und Mond wandern über den Horizont: Sonne von 06:00 (links) bis 18:00 (rechts), der Mond übernimmt die Nacht. Darüber
					Himmel, darunter Erde.
				</Text>
			) : null}

			<Text style={[styles.heading, styles.headingSpaced]}>Food-Widget (experimentell)</Text>
			<Text style={styles.hint}>
				Zeigt die Speisen des heutigen Tages als Foto-Raster im Home-Widget. iOS-Widgets können nicht wischen - stattdessen blättert
				die Timeline automatisch weiter (alle 10 Sekunden in der ersten Stunde, danach minütlich; iOS kann Wechsel je nach
				System-Budget zusammenfassen).
			</Text>

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
							setMeals(null);
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

			<Pressable style={[styles.applyButton, busy && styles.applyButtonDisabled]} onPress={applyToWidget} disabled={busy}>
				{busy ? <ActivityIndicator color="#2b2b28" /> : <Text style={styles.applyButtonText}>Speisen laden & Widget aktualisieren</Text>}
			</Pressable>

			{status ? <Text style={styles.status}>{status}</Text> : null}
			{error ? <Text style={styles.error}>{error}</Text> : null}

			{meals && meals.length > 0 ? (
				<View style={styles.preview}>
					<Text style={styles.sectionTitle}>Heutige Speisen</Text>
					{meals.map((meal, index) => (
						<View key={`preview-${index}`} style={styles.mealRow}>
							<Text style={styles.mealName}>{meal.name}</Text>
							{meal.price ? <Text style={styles.mealPrice}>{meal.price}</Text> : null}
						</View>
					))}
				</View>
			) : null}

			<Text style={styles.hint}>
				Widget hinzufügen: Home-Bildschirm lange drücken → Bearbeiten → Widget hinzufügen → „Tag und Jahr" → „Speisen heute".
			</Text>
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
	headingSpaced: {
		marginTop: 32,
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
	applyButton: {
		marginTop: 24,
		backgroundColor: CLOCK_COLORS.dayDot,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	applyButtonDisabled: {
		opacity: 0.6,
	},
	applyButtonText: {
		color: '#0d2321',
		fontSize: 15,
		fontWeight: '600',
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
	preview: {
		marginTop: 8,
	},
	mealRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		paddingVertical: 6,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(255,255,255,0.12)',
	},
	mealName: {
		color: '#e8ebf1',
		fontSize: 14,
		flexShrink: 1,
	},
	mealPrice: {
		color: '#c8cfdc',
		fontSize: 14,
	},
});
