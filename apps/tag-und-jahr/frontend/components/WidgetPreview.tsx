import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import YearClock from './YearClock';
import { ClockSettings } from '../helpers/clockSettings';
import { Meal, paginateMeals } from '../helpers/foodApi';
import { computeGridLayout } from '../helpers/gridLayout';

// In-app preview of the home screen widgets ("Playbook"): a square canvas the
// size of a large widget that mimics what the configured widget will look
// like - the year clock with the chosen theme, or the food photo grid with
// live auto-pagination (10s, like the widget timeline offers to iOS).

const CLOCK_BACKGROUND = '#5d6b85';
const FOOD_BACKGROUND_DARK = '#1e232e';
const PLACEHOLDER_DARK = '#2c3342';

export function ClockWidgetPreview({ size, settings }: Readonly<{ size: number; settings: ClockSettings }>) {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60 * 1000);
		return () => clearInterval(interval);
	}, []);
	return (
		<View style={[styles.canvas, { width: size, height: size, backgroundColor: CLOCK_BACKGROUND }]}>
			<YearClock size={size * 0.9} date={now} settings={settings} />
		</View>
	);
}

export function FoodWidgetPreview({ size, meals, mealsPerPage }: Readonly<{ size: number; meals: Meal[]; mealsPerPage: number }>) {
	const pages = useMemo(() => paginateMeals(meals, mealsPerPage), [meals, mealsPerPage]);
	const [pageIndex, setPageIndex] = useState(0);

	// Live auto-pagination like the widget timeline offers to iOS: next page
	// every 10 seconds.
	useEffect(() => {
		setPageIndex(0);
		if (pages.length <= 1) {
			return;
		}
		const interval = setInterval(() => setPageIndex((previous) => (previous + 1) % pages.length), 10 * 1000);
		return () => clearInterval(interval);
	}, [pages.length]);

	if (pages.length === 0) {
		return (
			<View style={[styles.canvas, { width: size, height: size, backgroundColor: FOOD_BACKGROUND_DARK }]}>
				<Text style={styles.emptyText}>Keine Daten - unten Server und Mensa wählen und Speisen laden.</Text>
			</View>
		);
	}

	const page = pages[Math.min(pageIndex, pages.length - 1)];
	const spacing = 2;
	// Width-driven square grid, exactly like the widget: columns fill the full
	// width, the height follows from the square cells (fit, never bleed).
	const layout = computeGridLayout(page.length, false);
	const cellSize = (size - spacing * (layout.columns - 1)) / layout.columns;
	const cells: (Meal | null)[] = [];
	for (let index = 0; index < layout.cellCount; index++) {
		cells.push(index < page.length ? page[index] : null);
	}

	return (
		<View style={[styles.canvas, { width: size, height: size, backgroundColor: FOOD_BACKGROUND_DARK }]}>
			<View style={{ width: size, flexDirection: 'row', flexWrap: 'wrap', gap: spacing }}>
				{cells.map((meal, index) => (
					<View key={`cell-${index}-${meal?.name ?? 'empty'}`} style={{ width: cellSize, height: cellSize, backgroundColor: PLACEHOLDER_DARK }}>
						{meal?.imageUrl ? <Image source={{ uri: meal.imageUrl }} style={styles.cellImage} resizeMode="cover" /> : null}
						{meal && !meal.imageUrl ? <Text style={styles.cellFallback}>🍴</Text> : null}
					</View>
				))}
			</View>
			{pages.length > 1 ? (
				<Text style={styles.pageBadge}>
					{Math.min(pageIndex, pages.length - 1) + 1}/{pages.length}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	canvas: {
		borderRadius: 24,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'center',
	},
	emptyText: {
		color: '#9aa3b2',
		fontSize: 12,
		textAlign: 'center',
		paddingHorizontal: 16,
	},
	cellImage: {
		width: '100%',
		height: '100%',
	},
	cellFallback: {
		flex: 1,
		textAlign: 'center',
		textAlignVertical: 'center',
		fontSize: 24,
		opacity: 0.5,
	},
	pageBadge: {
		position: 'absolute',
		right: 8,
		bottom: 6,
		color: 'rgba(255,255,255,0.8)',
		fontSize: 11,
		backgroundColor: 'rgba(0,0,0,0.35)',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
		overflow: 'hidden',
	},
});
