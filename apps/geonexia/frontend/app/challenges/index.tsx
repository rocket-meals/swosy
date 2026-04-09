import React, { useCallback, useMemo, useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import {
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
	FontAwesome5,
} from '@expo/vector-icons';
import { useTheme, SettingsListGroupTitle, SettingsListProgress } from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';
import type { RootState } from '../../store/store';

const PRIMARY_COLOR = '#7c3aed';
const ICON_FOREGROUND_COLOR = '#ffffff';

// ─── ISO week helpers ──────────────────────────────────────────────────────────

function getISOWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Returns the Monday 00:00:00 UTC and Sunday 23:59:59 UTC timestamps for an ISO week. */
function getISOWeekBounds(weekNumber: number, year: number): { start: number; end: number } {
	// Find Jan 4th of the year (always in week 1)
	const jan4 = new Date(Date.UTC(year, 0, 4));
	const jan4DayNum = jan4.getUTCDay() || 7;
	// Monday of week 1
	const week1Monday = new Date(jan4.getTime() - (jan4DayNum - 1) * 86400000);
	// Monday of target week
	const targetMonday = new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * 86400000);
	const targetSunday = new Date(targetMonday.getTime() + 7 * 86400000 - 1);
	return { start: targetMonday.getTime(), end: targetSunday.getTime() };
}

// ─── Challenge data model ──────────────────────────────────────────────────────

type ChallengeData = {
	activities: SavedActivity[];
	weeklyActivities: SavedActivity[];
	hexTileRecords: Record<string, { walkedOn: boolean; enclosedCount: number }>;
};

type ChallengeProgress = {
	current: number;
	goal: number;
};

type ChallengeDefinition = {
	weekNumber: number;
	title: string;
	description: string;
	iconBgColor: string;
	renderIcon: (color: string) => React.ReactElement;
	getProgress: (data: ChallengeData) => ChallengeProgress;
	formatProgress?: (current: number, goal: number) => string;
};

// ─── Helper functions ──────────────────────────────────────────────────────────

function getBestPace(activities: SavedActivity[]): number {
	return activities
		.filter((a) => a.stats.paceMinPerKm > 0)
		.reduce((min, a) => Math.min(min, a.stats.paceMinPerKm), Infinity);
}

function roundToHalf(n: number): number {
	return Math.round(n * 2) / 2;
}

/**
 * Returns a continuous week index starting at 1 for ISO week 1 of 2024
 * (epoch = Monday, 2024-01-01). This is used to determine the position
 * within the repeating 8-week training cycle.
 */
function getContinuousWeekIndex(date: Date): number {
	// Epoch: Monday Jan 1, 2024 (ISO week 1 of 2024)
	const EPOCH_MS = Date.UTC(2024, 0, 1);
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayOfWeek = d.getUTCDay() || 7; // Mon=1 … Sun=7
	const mondayMs = d.getTime() - (dayOfWeek - 1) * 86400000;
	return Math.max(1, Math.floor((mondayMs - EPOCH_MS) / (7 * 86400000)) + 1);
}

type WeekType = 'volume' | 'longrun' | 'stabilization' | 'deload';

/**
 * Determines the week type within the repeating 4-week cycle.
 *   weekIndex % 4 === 1 → volume week  (+8–10%)
 *   weekIndex % 4 === 2 → long-run week (long run +10%)
 *   weekIndex % 4 === 3 → stabilization week (+3–5%)
 *   weekIndex % 4 === 0 → deload week  (×0.70–0.80)
 */
function getWeekType(weekIndex: number): WeekType {
	const pos = weekIndex % 4;
	if (pos === 0) return 'deload';
	if (pos === 2) return 'longrun';
	if (pos === 3) return 'stabilization';
	return 'volume';
}

const WEEK_TYPE_LABELS: Record<WeekType, string> = {
	volume: 'Volumen-Woche',
	longrun: 'Long-Run-Woche',
	stabilization: 'Stabilisierungs-Woche',
	deload: 'Erholungs-Woche',
};

const WEEK_TYPE_COLORS: Record<WeekType, string> = {
	volume: '#2563eb',
	longrun: '#7c3aed',
	stabilization: '#d97706',
	deload: '#059669',
};

type RunChallengeTargets = {
	weekType: WeekType;
	totalWeeklyKm: number;
	longRunKm: number;
};

/**
 * Computes the dynamic running challenge targets for the current week based on:
 *  - Last 5 running activities (baseline average run length)
 *  - Previous week's activities (prev total distance + longest run)
 *  - The week's position in the 8-week training cycle (3 build + 1 deload)
 *
 * Rules applied:
 *  - Long run ≤ 40% of total weekly distance
 *  - Weekly distance increase capped at +5 km (injury prevention)
 *  - All values rounded to nearest 0.5 km
 */
function computeRunChallengeTargets(
	allActivities: SavedActivity[],
	now: Date,
): RunChallengeTargets {
	const weekIndex = getContinuousWeekIndex(now);
	const weekType = getWeekType(weekIndex);

	// Determine previous ISO week bounds (handles year boundary)
	const currentWeekNum = getISOWeekNumber(now);
	const currentYear = now.getFullYear();
	let prevWeekNum = currentWeekNum - 1;
	let prevWeekYear = currentYear;
	if (prevWeekNum < 1) {
		prevWeekYear = currentYear - 1;
		const dec28 = new Date(Date.UTC(prevWeekYear, 11, 28));
		prevWeekNum = getISOWeekNumber(dec28);
	}
	const prevBounds = getISOWeekBounds(prevWeekNum, prevWeekYear);

	// Running activities only (backward-compat: no sportType means run)
	const isRun = (a: SavedActivity) => !a.sportType || a.sportType === 'run';

	const prevWeekRuns = allActivities.filter(
		(a) => isRun(a) && a.startedAt >= prevBounds.start && a.startedAt <= prevBounds.end,
	);

	// Last 5 runs (most recent first) for baseline average
	const recentRuns = allActivities
		.filter(isRun)
		.sort((a, b) => b.startedAt - a.startedAt)
		.slice(0, 5);

	const avgRunKm =
		recentRuns.length > 0
			? recentRuns.reduce((s, a) => s + a.stats.distanceKm, 0) / recentRuns.length
			: 5;

	const runsPerWeek = prevWeekRuns.length > 0 ? prevWeekRuns.length : 3;
	const prevTotal =
		prevWeekRuns.length > 0
			? prevWeekRuns.reduce((s, a) => s + a.stats.distanceKm, 0)
			: Math.max(avgRunKm * runsPerWeek, 5);
	const prevLong =
		prevWeekRuns.length > 0
			? Math.max(...prevWeekRuns.map((a) => a.stats.distanceKm))
			: avgRunKm;

	// Second 4-week block within the 8-week cycle → slightly more aggressive
	const posIn8 = ((weekIndex - 1) % 8) + 1;
	const aggressiveBonus = posIn8 >= 5 ? 0.02 : 0;

	let newTotal: number;
	let newLong: number;

	switch (weekType) {
		case 'volume':
			newTotal = prevTotal * (1 + 0.09 + aggressiveBonus);
			newLong = Math.min(prevLong * 1.05, newTotal * 0.4);
			break;
		case 'longrun': {
			const longIncrease = prevLong * (0.1 + aggressiveBonus);
			newLong = prevLong + longIncrease;
			newTotal = prevTotal + longIncrease;
			break;
		}
		case 'stabilization':
			newTotal = prevTotal * (1 + 0.04 + aggressiveBonus / 2);
			newLong = prevLong;
			break;
		case 'deload':
		default:
			newTotal = prevTotal * 0.75;
			newLong = prevLong * 0.8;
			break;
	}

	// Constraint: long run ≤ 40% of total weekly distance
	newLong = Math.min(newLong, newTotal * 0.4);

	// Constraint: max +5 km increase per week (skip for deload)
	if (weekType !== 'deload') {
		newTotal = Math.min(newTotal, prevTotal + 5);
		newLong = Math.min(newLong, newTotal * 0.4);
	}

	return {
		weekType,
		totalWeeklyKm: roundToHalf(Math.max(newTotal, 1)),
		longRunKm: roundToHalf(Math.max(newLong, 0.5)),
	};
}

function getEnclosedTileCount(activity: SavedActivity): number {
	return activity.enclosedTileCount ?? (activity.enclosedHexTiles ?? activity.hexTilesEnclosed ?? []).length;
}

// ─── 52 weekly challenge definitions ─────────────────────────────────────────

const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
	// Week 1
	{
		weekNumber: 1,
		title: 'Erster Schritt',
		description: 'Schließe diese Woche 1 Aktivität ab und starte ins neue Jahr.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialIcons name="directions-run" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 1 }),
	},
	// Week 2
	{
		weekNumber: 2,
		title: 'Warm-Up-Woche',
		description: 'Laufe diese Woche insgesamt 3 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="straighten" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 3,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 3
	{
		weekNumber: 3,
		title: 'Hex-Entdecker',
		description: 'Betrete diese Woche 5 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <Ionicons name="map-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 5,
		}),
	},
	// Week 4
	{
		weekNumber: 4,
		title: 'Doppel-Aktivität',
		description: 'Schließe diese Woche 2 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialIcons name="event-repeat" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 2 }),
	},
	// Week 5
	{
		weekNumber: 5,
		title: '5-km-Runde',
		description: 'Laufe diese Woche insgesamt 5 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 5,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 6
	{
		weekNumber: 6,
		title: 'Stadterkunder',
		description: 'Betrete diese Woche 10 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <Ionicons name="navigate-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 10,
		}),
	},
	// Week 7
	{
		weekNumber: 7,
		title: 'Drei-Tage-Läufer',
		description: 'Schließe diese Woche 3 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialCommunityIcons name="run-fast" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 3 }),
	},
	// Week 8
	{
		weekNumber: 8,
		title: '8-km-Woche',
		description: 'Laufe diese Woche insgesamt 8 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="straighten" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 8,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 9
	{
		weekNumber: 9,
		title: 'Speed-Einheit',
		description: 'Laufe eine Aktivität mit einer Pace unter 6:30 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="speedometer" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 6.5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 6:30 min/km'),
	},
	// Week 10
	{
		weekNumber: 10,
		title: 'Frühlings-Warm-Up',
		description: 'Schließe diese Woche 2 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <Ionicons name="sunny-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 2 }),
	},
	// Week 11
	{
		weekNumber: 11,
		title: 'Hex-Kartograf',
		description: 'Betrete diese Woche 15 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="map-legend" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 15,
		}),
	},
	// Week 12
	{
		weekNumber: 12,
		title: '10-km-Woche',
		description: 'Laufe diese Woche insgesamt 10 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 10,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 13
	{
		weekNumber: 13,
		title: 'Tempo-Läufer',
		description: 'Laufe eine Aktivität mit einer Pace unter 6:00 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="lightning-bolt" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 6 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 6:00 min/km'),
	},
	// Week 14
	{
		weekNumber: 14,
		title: 'Berg-Anfänger',
		description: 'Sammle diese Woche 100 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <Ionicons name="trending-up-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 100,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 15
	{
		weekNumber: 15,
		title: 'Hex-Expansion',
		description: 'Betrete diese Woche 20 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="hexagon-multiple-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 20,
		}),
	},
	// Week 16
	{
		weekNumber: 16,
		title: 'Frühlings-Sprint',
		description: 'Laufe diese Woche insgesamt 12 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="directions-run" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 12,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 17
	{
		weekNumber: 17,
		title: 'Dreier-Pack',
		description: 'Schließe diese Woche 3 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialCommunityIcons name="run-fast" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 3 }),
	},
	// Week 18
	{
		weekNumber: 18,
		title: 'Territoriums-Baumeister',
		description: 'Schließe diese Woche 5 Hex-Felder mit einer Gebiet-Schleife ein.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="vector-polygon" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce(
				(s, a) => s + (getEnclosedTileCount(a)),
				0,
			),
			goal: 5,
		}),
	},
	// Week 19
	{
		weekNumber: 19,
		title: '15-km-Woche',
		description: 'Laufe diese Woche insgesamt 15 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 15,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 20
	{
		weekNumber: 20,
		title: 'Pace-Check',
		description: 'Laufe eine Aktivität mit einer Pace unter 5:30 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="speedometer" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 5.5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 5:30 min/km'),
	},
	// Week 21
	{
		weekNumber: 21,
		title: 'Hex-Meister',
		description: 'Betrete diese Woche 25 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="hexagon-multiple" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 25,
		}),
	},
	// Week 22
	{
		weekNumber: 22,
		title: 'Vierfach-Läufer',
		description: 'Schließe diese Woche 4 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialIcons name="event-repeat" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 4 }),
	},
	// Week 23
	{
		weekNumber: 23,
		title: 'Bergläufer',
		description: 'Sammle diese Woche 200 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="image-filter-hdr" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 200,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 24
	{
		weekNumber: 24,
		title: 'Mittsommer-Lauf',
		description: 'Laufe diese Woche insgesamt 20 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <Ionicons name="sunny-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 20,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 25
	{
		weekNumber: 25,
		title: 'Halbzeit-Challenge',
		description: 'Schließe diese Woche 5 Aktivitäten ab – Halbzeit des Jahres!',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialCommunityIcons name="flag-checkered" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 5 }),
	},
	// Week 26
	{
		weekNumber: 26,
		title: 'Hex-Legionär',
		description: 'Betrete diese Woche 30 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="earth" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 30,
		}),
	},
	// Week 27
	{
		weekNumber: 27,
		title: 'Sommer-Challenge',
		description: 'Laufe diese Woche insgesamt 25 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 25,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 28
	{
		weekNumber: 28,
		title: 'Speed-Run',
		description: 'Laufe eine Aktivität mit einer Pace unter 5:00 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="speedometer-slow" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 5:00 min/km'),
	},
	// Week 29
	{
		weekNumber: 29,
		title: 'Gipfelsturm',
		description: 'Sammle diese Woche 300 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="image-filter-hdr" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 300,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 30
	{
		weekNumber: 30,
		title: '30-km-Woche',
		description: 'Laufe diese Woche insgesamt 30 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="directions-run" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 30,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 31
	{
		weekNumber: 31,
		title: 'Hex-Legende',
		description: 'Betrete diese Woche 35 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="earth-plus" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 35,
		}),
	},
	// Week 32
	{
		weekNumber: 32,
		title: 'Fünf-Tage-Läufer',
		description: 'Schließe diese Woche 5 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialCommunityIcons name="run-fast" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 5 }),
	},
	// Week 33
	{
		weekNumber: 33,
		title: 'Berg-Champion',
		description: 'Sammle diese Woche 400 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="summit" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 400,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 34
	{
		weekNumber: 34,
		title: '35-km-Woche',
		description: 'Laufe diese Woche insgesamt 35 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 35,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 35
	{
		weekNumber: 35,
		title: 'Schnell-Läufer',
		description: 'Laufe eine Aktivität mit einer Pace unter 4:30 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="lightning-bolt" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 4.5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 4:30 min/km'),
	},
	// Week 36
	{
		weekNumber: 36,
		title: 'Herbst-Entdecker',
		description: 'Betrete diese Woche 30 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <Ionicons name="leaf-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 30,
		}),
	},
	// Week 37
	{
		weekNumber: 37,
		title: '40-km-Woche',
		description: 'Laufe diese Woche insgesamt 40 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="directions-run" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 40,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 38
	{
		weekNumber: 38,
		title: 'Höhen-Champion',
		description: 'Sammle diese Woche 500 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="summit" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 500,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 39
	{
		weekNumber: 39,
		title: 'Territoriums-Experte',
		description: 'Schließe diese Woche 10 Hex-Felder mit einer Gebiet-Schleife ein.',
		iconBgColor: '#059669',
		renderIcon: (c) => <MaterialCommunityIcons name="hexagon-multiple" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce(
				(s, a) => s + (getEnclosedTileCount(a)),
				0,
			),
			goal: 10,
		}),
	},
	// Week 40
	{
		weekNumber: 40,
		title: 'Speed-Demon',
		description: 'Laufe eine Aktivität mit einer Pace unter 4:00 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 4 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 4:00 min/km'),
	},
	// Week 41
	{
		weekNumber: 41,
		title: 'Herbst-Abenteuer',
		description: 'Schließe diese Woche 6 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <Ionicons name="leaf-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 6 }),
	},
	// Week 42
	{
		weekNumber: 42,
		title: '30-km-Woche II',
		description: 'Laufe diese Woche insgesamt 30 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 30,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 43
	{
		weekNumber: 43,
		title: 'Stadtforscher',
		description: 'Betrete diese Woche 25 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <Ionicons name="search-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 25,
		}),
	},
	// Week 44
	{
		weekNumber: 44,
		title: 'Bergläufer-Gold',
		description: 'Sammle diese Woche 350 m Höhengewinn.',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="image-filter-hdr" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.elevationGainM, 0),
			goal: 350,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	// Week 45
	{
		weekNumber: 45,
		title: '25-km-Woche',
		description: 'Laufe diese Woche insgesamt 25 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <MaterialIcons name="directions-run" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 25,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 46
	{
		weekNumber: 46,
		title: 'Spätherbst-Sprint',
		description: 'Laufe eine Aktivität mit einer Pace unter 5:00 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="speedometer" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 5:00 min/km'),
	},
	// Week 47
	{
		weekNumber: 47,
		title: 'Hex-Abenteuer',
		description: 'Betrete diese Woche 20 neue Hex-Felder.',
		iconBgColor: '#059669',
		renderIcon: (c) => <Ionicons name="map-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: new Set(weeklyActivities.flatMap((a) => a.hexTilesOrdered ?? [])).size,
			goal: 20,
		}),
	},
	// Week 48
	{
		weekNumber: 48,
		title: 'Winter-Ausdauer',
		description: 'Laufe diese Woche insgesamt 20 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <Ionicons name="snow-outline" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 20,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 49
	{
		weekNumber: 49,
		title: 'Beständigkeit',
		description: 'Schließe diese Woche 3 Aktivitäten ab.',
		iconBgColor: '#d97706',
		renderIcon: (c) => <MaterialCommunityIcons name="run-fast" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 3 }),
	},
	// Week 50
	{
		weekNumber: 50,
		title: 'Jahresend-Lauf',
		description: 'Laufe diese Woche insgesamt 15 km.',
		iconBgColor: '#2563eb',
		renderIcon: (c) => <FontAwesome5 name="running" size={20} color={c} />,
		getProgress: ({ weeklyActivities }) => ({
			current: weeklyActivities.reduce((s, a) => s + a.stats.distanceKm, 0),
			goal: 15,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	// Week 51
	{
		weekNumber: 51,
		title: 'Letzter Sprint',
		description: 'Laufe eine Aktivität mit einer Pace unter 5:30 min/km.',
		iconBgColor: '#dc2626',
		renderIcon: (c) => <MaterialCommunityIcons name="lightning-bolt" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => {
			const best = getBestPace(weeklyActivities);
			return { current: best <= 5.5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Geschafft ✓' : 'Pace < 5:30 min/km'),
	},
	// Week 52
	{
		weekNumber: 52,
		title: 'Jahresabschluss',
		description: 'Schließe diese Woche 2 Aktivitäten ab und feiere ein aktives Jahr!',
		iconBgColor: '#7c3aed',
		renderIcon: (c) => <MaterialCommunityIcons name="trophy" size={22} color={c} />,
		getProgress: ({ weeklyActivities }) => ({ current: weeklyActivities.length, goal: 2 }),
	},
];

function isChallengeCompleted(def: ChallengeDefinition, data: ChallengeData): boolean {
	const { current, goal } = def.getProgress(data);
	return current >= goal;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type ChallengeCardProps = {
	definition: ChallengeDefinition;
	data: ChallengeData;
	isCurrent: boolean;
	index: number;
	total: number;
};

function ChallengeCard({ definition, data, isCurrent, index, total }: ChallengeCardProps) {
	const completed = isChallengeCompleted(definition, data);
	const { current, goal } = definition.getProgress(data);
	const progress = Math.min(1, current / goal);
	const iconBg = completed || isCurrent ? definition.iconBgColor : '#9ca3af';
	const progressText = definition.formatProgress
		? definition.formatProgress(current, goal)
		: `${Math.min(current, goal).toLocaleString()} / ${goal.toLocaleString()}`;

	let groupPosition: 'top' | 'middle' | 'bottom' | 'single' | undefined;
	if (total === 1) {
		groupPosition = 'single';
	} else if (index === 0) {
		groupPosition = 'top';
	} else if (index === total - 1) {
		groupPosition = 'bottom';
	} else {
		groupPosition = 'middle';
	}

	return (
		<SettingsListProgress
			title={`KW ${definition.weekNumber} · ${definition.title}`}
			leftIconComponent={
				<View style={[styles.cardIconWrapper, { backgroundColor: iconBg }]}>
					{definition.renderIcon(ICON_FOREGROUND_COLOR)}
				</View>
			}
			noIconIndent
			description={definition.description}
			progress={isCurrent ? progress : completed ? 1 : 0}
			progressText={completed ? '✓' : isCurrent ? progressText : '–'}
			progressColor={completed ? definition.iconBgColor : PRIMARY_COLOR}
			groupPosition={groupPosition}
			showSeparator={index < total - 1}
		/>
	);
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
	const { theme } = useTheme();
	const hexTileRecords = useSelector((state: RootState) => state.hexTiles.records);
	const [activities, setActivities] = useState<SavedActivity[]>([]);

	useFocusEffect(
		useCallback(() => {
			loadActivities()
				.then(setActivities)
				.catch((err) => console.warn('[ChallengesScreen] Failed to load activities:', err));
		}, []),
	);

	const now = new Date();
	const currentWeek = getISOWeekNumber(now);
	const currentYear = now.getFullYear();

	const weekBounds = useMemo(
		() => getISOWeekBounds(currentWeek, currentYear),
		[currentWeek, currentYear],
	);

	const weeklyActivities = useMemo(
		() => activities.filter((a) => a.startedAt >= weekBounds.start && a.startedAt <= weekBounds.end),
		[activities, weekBounds],
	);

	const data: ChallengeData = useMemo(
		() => ({ activities, weeklyActivities, hexTileRecords }),
		[activities, weeklyActivities, hexTileRecords],
	);

	// In ISO years with 53 weeks, clamp to week 52 so the last defined challenge is shown.
	const clampedWeek = Math.min(currentWeek, 52);
	const currentChallenge = WEEKLY_CHALLENGES.find((c) => c.weekNumber === clampedWeek) ?? WEEKLY_CHALLENGES[WEEKLY_CHALLENGES.length - 1];
	const currentCompleted = isChallengeCompleted(currentChallenge, data);

	const completedCount = useMemo(
		() =>
			WEEKLY_CHALLENGES.filter((def) => {
				const bounds = getISOWeekBounds(def.weekNumber, currentYear);
				const wa = activities.filter(
					(a) => a.startedAt >= bounds.start && a.startedAt <= bounds.end,
				);
				return isChallengeCompleted(def, { activities, weeklyActivities: wa, hexTileRecords });
			}).length,
		[activities, hexTileRecords, currentYear],
	);

	const pastChallenges = WEEKLY_CHALLENGES.filter((c) => c.weekNumber < clampedWeek);
	const upcomingChallenges = WEEKLY_CHALLENGES.filter((c) => c.weekNumber > clampedWeek);

	// ── Dynamic training-plan challenges ──────────────────────────────────────
	const runTargets = useMemo(
		() => computeRunChallengeTargets(activities, now),
		[activities, currentWeek, currentYear], // currentWeek/currentYear are the stable proxy for `now`
	);

	const weekRunActivities = useMemo(
		() =>
			weeklyActivities.filter((a) => !a.sportType || a.sportType === 'run'),
		[weeklyActivities],
	);

	const currentWeekTotalKm = weekRunActivities.reduce(
		(s, a) => s + a.stats.distanceKm,
		0,
	);
	const currentWeekLongRun =
		weekRunActivities.length > 0
			? Math.max(...weekRunActivities.map((a) => a.stats.distanceKm))
			: 0;

	const volumeProgress = Math.min(1, currentWeekTotalKm / runTargets.totalWeeklyKm);
	const longRunProgress = Math.min(1, currentWeekLongRun / runTargets.longRunKm);
	const volumeCompleted = currentWeekTotalKm >= runTargets.totalWeeklyKm;
	const longRunCompleted = currentWeekLongRun >= runTargets.longRunKm;
	const weekTypeColor = WEEK_TYPE_COLORS[runTargets.weekType];

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>

				{/* Summary header */}
				<View style={[styles.summaryCard, { backgroundColor: PRIMARY_COLOR }]}>
					<View style={styles.summaryIconWrapper}>
						<MaterialCommunityIcons name="sword-cross" size={32} color={ICON_FOREGROUND_COLOR} />
					</View>
					<View>
						<Text style={styles.summaryLabel}>Herausforderungen abgeschlossen</Text>
						<Text style={styles.summaryValue}>
							{completedCount} / {WEEKLY_CHALLENGES.length}
						</Text>
					</View>
				</View>

				{/* Current week challenge */}
				<SettingsListGroupTitle title={`Aktuelle Woche (KW ${clampedWeek})`} />
				<ChallengeCard
					definition={currentChallenge}
					data={data}
					isCurrent
					index={0}
					total={1}
				/>

				{currentCompleted && (
					<View style={styles.completedBanner}>
						<MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
						<Text style={[styles.completedBannerText, { color: '#059669' }]}>
							Herausforderung diese Woche abgeschlossen! 🎉
						</Text>
					</View>
				)}

				{/* Dynamic training-plan challenges */}
				<SettingsListGroupTitle title={`Trainingsplan · ${WEEK_TYPE_LABELS[runTargets.weekType]}`} />
				<SettingsListProgress
					title="Lauf-Volumen"
					leftIconComponent={
						<View style={[styles.cardIconWrapper, { backgroundColor: volumeCompleted ? weekTypeColor : PRIMARY_COLOR }]}>
							<FontAwesome5 name="running" size={18} color={ICON_FOREGROUND_COLOR} />
						</View>
					}
					noIconIndent
					description={`Laufe diese Woche insgesamt ${runTargets.totalWeeklyKm} km`}
					progress={volumeProgress}
					progressText={volumeCompleted ? '✓' : `${currentWeekTotalKm.toFixed(1)} / ${runTargets.totalWeeklyKm} km`}
					progressColor={volumeCompleted ? weekTypeColor : PRIMARY_COLOR}
					groupPosition="top"
					showSeparator
				/>
				<SettingsListProgress
					title="Long Run"
					leftIconComponent={
						<View style={[styles.cardIconWrapper, { backgroundColor: longRunCompleted ? weekTypeColor : PRIMARY_COLOR }]}>
							<MaterialCommunityIcons name="run-fast" size={20} color={ICON_FOREGROUND_COLOR} />
						</View>
					}
					noIconIndent
					description={`Längster Einzellauf: ${runTargets.longRunKm} km`}
					progress={longRunProgress}
					progressText={longRunCompleted ? '✓' : `${currentWeekLongRun.toFixed(1)} / ${runTargets.longRunKm} km`}
					progressColor={longRunCompleted ? weekTypeColor : PRIMARY_COLOR}
					groupPosition="bottom"
					showSeparator={false}
				/>

				{/* Past challenges */}
				{pastChallenges.length > 0 && (
					<>
						<SettingsListGroupTitle title="Vergangene Wochen" />
						{pastChallenges.map((def, index) => {
							const bounds = getISOWeekBounds(def.weekNumber, currentYear);
							const wa = activities.filter(
								(a) => a.startedAt >= bounds.start && a.startedAt <= bounds.end,
							);
							const pastData: ChallengeData = { activities, weeklyActivities: wa, hexTileRecords };
							return (
								<ChallengeCard
									key={def.weekNumber}
									definition={def}
									data={pastData}
									isCurrent={false}
									index={index}
									total={pastChallenges.length}
								/>
							);
						})}
					</>
				)}

				{/* Upcoming challenges */}
				{upcomingChallenges.length > 0 && (
					<>
						<SettingsListGroupTitle title="Kommende Wochen" />
						{upcomingChallenges.map((def, index) => (
							<ChallengeCard
								key={def.weekNumber}
								definition={def}
								data={{ activities: [], weeklyActivities: [], hexTileRecords: {} }}
								isCurrent={false}
								index={index}
								total={upcomingChallenges.length}
							/>
						))}
					</>
				)}

			</ScrollView>
		</View>
	);
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		gap: 8,
	},

	// Summary header card
	summaryCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 14,
		padding: 18,
		gap: 16,
		marginBottom: 8,
	},
	summaryIconWrapper: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: 'rgba(255,255,255,0.25)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryLabel: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.8)',
		fontWeight: '500',
	},
	summaryValue: {
		fontSize: 26,
		fontWeight: '700',
		color: '#ffffff',
	},

	// Challenge card icon
	cardIconWrapper: {
		width: 34,
		height: 34,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},

	// Completed banner
	completedBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: 'rgba(5,150,105,0.1)',
		borderRadius: 10,
	},
	completedBannerText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
