import React, { useCallback, useMemo, useState } from 'react';
import {
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
Ionicons,
MaterialCommunityIcons,
FontAwesome5,
} from '@expo/vector-icons';
import { useTheme, SettingsList, SettingsListGroupTitle, SettingsListProgress } from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';
import { useDebugMode } from '../../hooks/useDebugMode';

const PRIMARY_COLOR = '#7c3aed';
const ICON_FOREGROUND_COLOR = '#ffffff';
const NUM_PAST_WEEKS = 7;
const NUM_FUTURE_WEEKS = 7;

// ─── ISO week helpers ──────────────────────────────────────────────────────────

function getISOWeekNumber(date: Date): number {
const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dayNum = d.getUTCDay() || 7;
d.setUTCDate(d.getUTCDate() + 4 - dayNum);
const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dayNum = d.getUTCDay() || 7;
d.setUTCDate(d.getUTCDate() + 4 - dayNum);
return d.getUTCFullYear();
}

function getISOWeekBounds(weekNumber: number, year: number): { start: number; end: number } {
const jan4 = new Date(Date.UTC(year, 0, 4));
const jan4DayNum = jan4.getUTCDay() || 7;
const week1Monday = new Date(jan4.getTime() - (jan4DayNum - 1) * 86400000);
const targetMonday = new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * 86400000);
const targetSunday = new Date(targetMonday.getTime() + 7 * 86400000 - 1);
return { start: targetMonday.getTime(), end: targetSunday.getTime() };
}

function getMondayOfISOWeek(weekNumber: number, year: number): Date {
const jan4 = new Date(Date.UTC(year, 0, 4));
const jan4DayNum = jan4.getUTCDay() || 7;
const week1Monday = new Date(jan4.getTime() - (jan4DayNum - 1) * 86400000);
return new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * 86400000);
}

function getISOWeekOffset(
weekNum: number,
year: number,
offset: number,
): { weekNum: number; year: number } {
const monday = getMondayOfISOWeek(weekNum, year);
const targetDate = new Date(monday.getTime() + offset * 7 * 86400000);
return { weekNum: getISOWeekNumber(targetDate), year: getISOWeekYear(targetDate) };
}

// ─── Training cycle helpers ────────────────────────────────────────────────────

function roundToHalf(n: number): number {
return Math.round(n * 2) / 2;
}

/**
 * Returns a continuous week index starting at 1 for ISO week 1 of 2024
 * (epoch = Monday, 2024-01-01). Used to determine position within the
 * repeating 8-week training cycle.
 */
function getContinuousWeekIndex(date: Date): number {
const EPOCH_MS = Date.UTC(2024, 0, 1);
const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dayOfWeek = d.getUTCDay() || 7;
const mondayMs = d.getTime() - (dayOfWeek - 1) * 86400000;
return Math.max(1, Math.floor((mondayMs - EPOCH_MS) / (7 * 86400000)) + 1);
}

function getContinuousWeekIndexForISOWeek(weekNum: number, year: number): number {
const monday = getMondayOfISOWeek(weekNum, year);
return getContinuousWeekIndex(monday);
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

const WEEK_TYPE_DESCRIPTIONS: Record<WeekType, string> = {
volume: 'Gesamtkilometer steigern (+8–10 %)',
longrun: 'Längsten Lauf steigern (+10 %)',
stabilization: 'Belastung halten (+3–5 %)',
deload: 'Erholung & Regeneration (70–80 %)',
};

// ─── Training plan computation ─────────────────────────────────────────────────

type RunChallengeTargets = {
weekType: WeekType;
totalWeeklyKm: number;
longRunKm: number;
debugTotalFormula: string;
debugLongRunFormula: string;
};

/**
 * Pure computation: given the continuous week index and previous week's
 * totals, compute training targets for the current week.
 */
function computeWeekTargetsFromPrev(
weekIndex: number,
prevTotal: number,
prevLong: number,
): RunChallengeTargets {
const weekType = getWeekType(weekIndex);
const posIn8 = ((weekIndex - 1) % 8) + 1;
const aggressiveBonus = posIn8 >= 5 ? 0.02 : 0;

let newTotal: number;
let newLong: number;
let debugTotalFormula: string;
let debugLongRunFormula: string;

switch (weekType) {
case 'volume': {
const factor = 1 + 0.09 + aggressiveBonus;
newTotal = prevTotal * factor;
newLong = Math.min(prevLong * 1.05, newTotal * 0.4);
debugTotalFormula = `${prevTotal.toFixed(1)} × ${factor.toFixed(2)} = ${(prevTotal * factor).toFixed(1)}`;
debugLongRunFormula = `min(${prevLong.toFixed(1)} × 1.05, ${(prevTotal * factor).toFixed(1)} × 0.4) = ${newLong.toFixed(1)}`;
break;
}
case 'longrun': {
const longFactor = 0.1 + aggressiveBonus;
const longIncrease = prevLong * longFactor;
newLong = prevLong + longIncrease;
newTotal = prevTotal + longIncrease;
debugTotalFormula = `${prevTotal.toFixed(1)} + ${prevLong.toFixed(1)} × ${longFactor.toFixed(2)} = ${newTotal.toFixed(1)}`;
debugLongRunFormula = `${prevLong.toFixed(1)} + ${prevLong.toFixed(1)} × ${longFactor.toFixed(2)} = ${newLong.toFixed(1)}`;
break;
}
case 'stabilization': {
const factor = 1 + 0.04 + aggressiveBonus / 2;
newTotal = prevTotal * factor;
newLong = prevLong;
debugTotalFormula = `${prevTotal.toFixed(1)} × ${factor.toFixed(3)} = ${newTotal.toFixed(1)}`;
debugLongRunFormula = `${prevLong.toFixed(1)} (unverändert)`;
break;
}
case 'deload':
default: {
newTotal = prevTotal * 0.75;
newLong = prevLong * 0.8;
debugTotalFormula = `${prevTotal.toFixed(1)} × 0.75 = ${newTotal.toFixed(1)}`;
debugLongRunFormula = `${prevLong.toFixed(1)} × 0.80 = ${newLong.toFixed(1)}`;
break;
}
}

// Constraint: long run ≤ 40 % of total weekly distance
if (newLong > newTotal * 0.4) {
debugLongRunFormula += ` → cap 40 %: ${(newTotal * 0.4).toFixed(1)}`;
newLong = newTotal * 0.4;
}

// Constraint: max +5 km increase per week (skip for deload)
if (weekType !== 'deload' && newTotal > prevTotal + 5) {
debugTotalFormula += ` → cap +5: ${(prevTotal + 5).toFixed(1)}`;
newTotal = prevTotal + 5;
if (newLong > newTotal * 0.4) {
debugLongRunFormula += ` → re-cap 40 %: ${(newTotal * 0.4).toFixed(1)}`;
newLong = newTotal * 0.4;
}
}

const finalTotal = roundToHalf(Math.max(newTotal, 1));
const finalLong = roundToHalf(Math.max(newLong, 0.5));
debugTotalFormula += ` → ${finalTotal}`;
debugLongRunFormula += ` → ${finalLong}`;

return {
weekType,
totalWeeklyKm: finalTotal,
longRunKm: finalLong,
debugTotalFormula,
debugLongRunFormula,
};
}

const isRun = (a: SavedActivity) => !a.sportType || a.sportType === 'run';

/** Get actual running data for a given ISO week. */
function getWeekRunData(
activities: SavedActivity[],
weekNum: number,
year: number,
): { totalKm: number; longRunKm: number; count: number } {
const bounds = getISOWeekBounds(weekNum, year);
const weekRuns = activities.filter(
(a) => isRun(a) && a.startedAt >= bounds.start && a.startedAt <= bounds.end,
);
const totalKm = weekRuns.reduce((s, a) => s + a.stats.distanceKm, 0);
const longRunKm =
weekRuns.length > 0 ? Math.max(...weekRuns.map((a) => a.stats.distanceKm)) : 0;
return { totalKm, longRunKm, count: weekRuns.length };
}

/**
 * Compute training targets for a specific ISO week using actual activity
 * data from the previous week as baseline.
 *
 * When the previous week was a deload, the baseline falls back to the
 * pre-deload week (2 weeks back) so the new build phase starts above
 * the previous cycle.
 */
function computeTargetsForISOWeek(
allActivities: SavedActivity[],
weekNum: number,
year: number,
): RunChallengeTargets {
const weekIndex = getContinuousWeekIndexForISOWeek(weekNum, year);
const prevWeekType = getWeekType(weekIndex - 1);

const { weekNum: prevWN, year: prevY } = getISOWeekOffset(weekNum, year, -1);
const prevData = getWeekRunData(allActivities, prevWN, prevY);

// Baseline from last 5 runs before the target week (fallback)
const currentBounds = getISOWeekBounds(weekNum, year);
const recentRuns = allActivities
.filter(isRun)
.filter((a) => a.startedAt < currentBounds.start)
.sort((a, b) => b.startedAt - a.startedAt)
.slice(0, 5);
const avgRunKm =
recentRuns.length > 0
? recentRuns.reduce((s, a) => s + a.stats.distanceKm, 0) / recentRuns.length
: 5;

let prevTotal: number;
let prevLong: number;

if (prevWeekType === 'deload') {
// After deload → use pre-deload week (2 weeks back) so the new
// build phase starts at a slightly higher level.
const { weekNum: twoBackWN, year: twoBackY } = getISOWeekOffset(weekNum, year, -2);
const preDeloadData = getWeekRunData(allActivities, twoBackWN, twoBackY);
if (preDeloadData.count > 0) {
prevTotal = preDeloadData.totalKm;
prevLong = preDeloadData.longRunKm;
} else if (prevData.count > 0) {
prevTotal = prevData.totalKm;
prevLong = prevData.longRunKm;
} else {
prevTotal = Math.max(avgRunKm * 3, 5);
prevLong = avgRunKm;
}
} else if (prevData.count > 0) {
prevTotal = prevData.totalKm;
prevLong = prevData.longRunKm;
} else {
prevTotal = Math.max(avgRunKm * 3, 5);
prevLong = avgRunKm;
}

return computeWeekTargetsFromPrev(weekIndex, prevTotal, prevLong);
}

/**
 * Project future week targets by chaining forward from a baseline.
 * After each deload week the new build phase is based on the pre-deload
 * values to ensure progressive overload over time.
 */
function projectFutureWeeks(
startTotal: number,
startLong: number,
startWeekIndex: number,
numWeeks: number,
preDeloadTotal?: number,
preDeloadLong?: number,
): RunChallengeTargets[] {
const results: RunChallengeTargets[] = [];

// History of totals/longs so we can look 2 back after deload.
// If the caller provides pre-deload values and the start week is
// itself a deload, prepend them so [length-2] works correctly.
const totals: number[] = [];
const longs: number[] = [];

if (
preDeloadTotal !== undefined &&
preDeloadLong !== undefined &&
getWeekType(startWeekIndex) === 'deload'
) {
totals.push(preDeloadTotal);
longs.push(preDeloadLong);
}

totals.push(startTotal);
longs.push(startLong);

for (let i = 1; i <= numWeeks; i++) {
const weekIndex = startWeekIndex + i;
const prevWeekType = getWeekType(weekIndex - 1);

let inputTotal: number;
let inputLong: number;

if (prevWeekType === 'deload' && totals.length >= 2) {
// Use pre-deload values
inputTotal = totals[totals.length - 2];
inputLong = longs[longs.length - 2];
} else {
inputTotal = totals[totals.length - 1];
inputLong = longs[longs.length - 1];
}

const targets = computeWeekTargetsFromPrev(weekIndex, inputTotal, inputLong);
results.push(targets);
totals.push(targets.totalWeeklyKm);
longs.push(targets.longRunKm);
}

return results;
}

// ─── Week plan data ────────────────────────────────────────────────────────────

type WeekPlanData = {
weekNum: number;
year: number;
weekIndex: number;
targets: RunChallengeTargets;
actualTotalKm?: number;
actualLongRunKm?: number;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

type TrainingWeekCardProps = {
plan: WeekPlanData;
isCurrent: boolean;
isDebug: boolean;
/** Position within the rendered group for border radius */
groupPosition: 'top' | 'middle' | 'bottom' | 'single';
showSeparator: boolean;
};

function TrainingWeekCard({
plan,
isCurrent,
isDebug,
groupPosition,
showSeparator,
}: TrainingWeekCardProps) {
const { targets, actualTotalKm, actualLongRunKm } = plan;
const weekTypeColor = WEEK_TYPE_COLORS[targets.weekType];
const hasActuals = actualTotalKm !== undefined;

const volumeCompleted = hasActuals && actualTotalKm >= targets.totalWeeklyKm;
const longRunCompleted = hasActuals && (actualLongRunKm ?? 0) >= targets.longRunKm;

const volumeProgress = hasActuals
? Math.min(1, actualTotalKm / targets.totalWeeklyKm)
: 0;
const longRunProgress = hasActuals
? Math.min(1, (actualLongRunKm ?? 0) / targets.longRunKm)
: 0;

let volumeProgressText: string;
if (volumeCompleted) {
volumeProgressText = '✓';
} else if (hasActuals) {
volumeProgressText = `${actualTotalKm.toFixed(1)} / ${targets.totalWeeklyKm} km`;
} else {
volumeProgressText = `Ziel: ${targets.totalWeeklyKm} km`;
}

let longRunProgressText: string;
if (longRunCompleted) {
longRunProgressText = '✓';
} else if (hasActuals) {
longRunProgressText = `${(actualLongRunKm ?? 0).toFixed(1)} / ${targets.longRunKm} km`;
} else {
longRunProgressText = `Ziel: ${targets.longRunKm} km`;
}

const volumeDesc =
`Laufe insgesamt ${targets.totalWeeklyKm} km` +
(isDebug ? `\n🔧 ${targets.debugTotalFormula}` : '');
const longRunDesc =
`Längster Einzellauf: ${targets.longRunKm} km` +
(isDebug ? `\n🔧 ${targets.debugLongRunFormula}` : '');

// Determine group positions for the two rows within this card.
// The card always renders two rows (volume + long run).
let topPos: 'top' | 'middle' | 'single';
let bottomPos: 'bottom' | 'middle' | 'single';
if (groupPosition === 'single') {
topPos = 'top';
bottomPos = 'bottom';
} else if (groupPosition === 'top') {
topPos = 'top';
bottomPos = 'middle';
} else if (groupPosition === 'bottom') {
topPos = 'middle';
bottomPos = 'bottom';
} else {
topPos = 'middle';
bottomPos = 'middle';
}

return (
<>
<SettingsListProgress
title={`KW ${plan.weekNum} · ${WEEK_TYPE_LABELS[targets.weekType]}`}
leftIconComponent={
<View
style={[
styles.cardIconWrapper,
{ backgroundColor: volumeCompleted ? weekTypeColor : (isCurrent ? PRIMARY_COLOR : '#9ca3af') },
]}
>
<FontAwesome5 name="running" size={18} color={ICON_FOREGROUND_COLOR} />
</View>
}
noIconIndent
description={volumeDesc}
progress={volumeProgress}
progressText={volumeProgressText}
progressColor={volumeCompleted ? weekTypeColor : PRIMARY_COLOR}
groupPosition={topPos}
showSeparator
/>
<SettingsListProgress
title="Long Run"
leftIconComponent={
<View
style={[
styles.cardIconWrapper,
{ backgroundColor: longRunCompleted ? weekTypeColor : (isCurrent ? PRIMARY_COLOR : '#9ca3af') },
]}
>
<MaterialCommunityIcons name="run-fast" size={20} color={ICON_FOREGROUND_COLOR} />
</View>
}
noIconIndent
description={longRunDesc}
progress={longRunProgress}
progressText={longRunProgressText}
progressColor={longRunCompleted ? weekTypeColor : PRIMARY_COLOR}
groupPosition={bottomPos}
showSeparator={showSeparator}
/>
</>
);
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
const { theme } = useTheme();
const isDebug = useDebugMode();
const [activities, setActivities] = useState<SavedActivity[]>([]);
const [showPastWeeks, setShowPastWeeks] = useState(false);

useFocusEffect(
useCallback(() => {
loadActivities()
.then(setActivities)
.catch((err) => console.warn('[ChallengesScreen] Failed to load activities:', err));
}, []),
);

const now = new Date();
const currentWeek = getISOWeekNumber(now);
const currentYear = getISOWeekYear(now);
const currentWeekIndex = getContinuousWeekIndex(now);

// ── Current week ─────────────────────────────────────────────────────────
const currentTargets = useMemo(
() => computeTargetsForISOWeek(activities, currentWeek, currentYear),
[activities, currentWeek, currentYear],
);

const weekRunActivities = useMemo(
() => {
const bounds = getISOWeekBounds(currentWeek, currentYear);
return activities.filter(
(a) => isRun(a) && a.startedAt >= bounds.start && a.startedAt <= bounds.end,
);
},
[activities, currentWeek, currentYear],
);

const currentWeekTotalKm = weekRunActivities.reduce(
(s, a) => s + a.stats.distanceKm,
0,
);
const currentWeekLongRun =
weekRunActivities.length > 0
? Math.max(...weekRunActivities.map((a) => a.stats.distanceKm))
: 0;

const currentPlan: WeekPlanData = useMemo(
() => ({
weekNum: currentWeek,
year: currentYear,
weekIndex: currentWeekIndex,
targets: currentTargets,
actualTotalKm: currentWeekTotalKm,
actualLongRunKm: currentWeekLongRun,
}),
[currentWeek, currentYear, currentWeekIndex, currentTargets, currentWeekTotalKm, currentWeekLongRun],
);

// ── Past weeks ───────────────────────────────────────────────────────────
const pastPlans: WeekPlanData[] = useMemo(() => {
const plans: WeekPlanData[] = [];
for (let offset = -NUM_PAST_WEEKS; offset < 0; offset++) {
const { weekNum, year } = getISOWeekOffset(currentWeek, currentYear, offset);
const weekIndex = getContinuousWeekIndexForISOWeek(weekNum, year);
const targets = computeTargetsForISOWeek(activities, weekNum, year);
const actual = getWeekRunData(activities, weekNum, year);
plans.push({
weekNum,
year,
weekIndex,
targets,
actualTotalKm: actual.totalKm,
actualLongRunKm: actual.longRunKm,
});
}
return plans;
}, [activities, currentWeek, currentYear]);

// ── Future weeks ─────────────────────────────────────────────────────────
const futurePlans: WeekPlanData[] = useMemo(() => {
// Pre-deload baseline for correct post-deload recovery
let preDeloadTotal: number | undefined;
let preDeloadLong: number | undefined;
if (currentTargets.weekType === 'deload') {
const { weekNum: twoBack, year: twoBackY } = getISOWeekOffset(currentWeek, currentYear, -2);
const preDeloadData = getWeekRunData(activities, twoBack, twoBackY);
if (preDeloadData.count > 0) {
preDeloadTotal = preDeloadData.totalKm;
preDeloadLong = preDeloadData.longRunKm;
}
}

const projected = projectFutureWeeks(
currentTargets.totalWeeklyKm,
currentTargets.longRunKm,
currentWeekIndex,
NUM_FUTURE_WEEKS,
preDeloadTotal,
preDeloadLong,
);

return projected.map((targets, i) => {
const offset = i + 1;
const { weekNum, year } = getISOWeekOffset(currentWeek, currentYear, offset);
const weekIndex = getContinuousWeekIndexForISOWeek(weekNum, year);
return { weekNum, year, weekIndex, targets };
});
}, [activities, currentWeek, currentYear, currentWeekIndex, currentTargets]);

// ── Cycle info ───────────────────────────────────────────────────────────
const posIn8 = ((currentWeekIndex - 1) % 8) + 1;
const blockLabel = posIn8 <= 4 ? 'Block 1' : 'Block 2';

return (
<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
<ScrollView contentContainerStyle={styles.scrollContent}>

{/* Summary header */}
<View style={[styles.summaryCard, { backgroundColor: PRIMARY_COLOR }]}>
<View style={styles.summaryIconWrapper}>
<MaterialCommunityIcons name="sword-cross" size={32} color={ICON_FOREGROUND_COLOR} />
</View>
<View style={{ flex: 1 }}>
<Text style={styles.summaryLabel}>8-Wochen-Trainingszyklus</Text>
<Text style={styles.summaryValue}>
Woche {posIn8} / 8 · {blockLabel}
</Text>
<Text style={styles.summarySubLabel}>
{WEEK_TYPE_LABELS[currentTargets.weekType]} – {WEEK_TYPE_DESCRIPTIONS[currentTargets.weekType]}
</Text>
</View>
</View>

{/* Toggle button for past weeks */}
<SettingsList
title={showPastWeeks ? 'Vorherige Wochen ausblenden' : 'Vorherige Kalenderwochen anzeigen'}
leftIcon={
<Ionicons
name={showPastWeeks ? 'chevron-up' : 'chevron-down'}
size={20}
color={ICON_FOREGROUND_COLOR}
/>
}
iconBgColor="#6b7280"
onPress={() => setShowPastWeeks((prev) => !prev)}
groupPosition="single"
showSeparator={false}
/>

{/* Past weeks (collapsed by default) */}
{showPastWeeks && pastPlans.length > 0 && (
<>
<SettingsListGroupTitle title="Vergangene Wochen" />
{pastPlans.map((plan, idx) => (
<TrainingWeekCard
key={`past-${plan.weekNum}-${plan.year}`}
plan={plan}
isCurrent={false}
isDebug={isDebug}
groupPosition={
pastPlans.length === 1
? 'single'
: idx === 0
? 'top'
: idx === pastPlans.length - 1
? 'bottom'
: 'middle'
}
showSeparator={idx < pastPlans.length - 1}
/>
))}
</>
)}

{/* Current week */}
<SettingsListGroupTitle
title={`Aktuelle Woche (KW ${currentWeek}) · ${WEEK_TYPE_LABELS[currentTargets.weekType]}`}
/>
<TrainingWeekCard
plan={currentPlan}
isCurrent
isDebug={isDebug}
groupPosition="single"
showSeparator={false}
/>

{/* Upcoming weeks */}
{futurePlans.length > 0 && (
<>
<SettingsListGroupTitle title="Kommende Wochen" />
{futurePlans.map((plan, idx) => (
<TrainingWeekCard
key={`future-${plan.weekNum}-${plan.year}`}
plan={plan}
isCurrent={false}
isDebug={isDebug}
groupPosition={
futurePlans.length === 1
? 'single'
: idx === 0
? 'top'
: idx === futurePlans.length - 1
? 'bottom'
: 'middle'
}
showSeparator={idx < futurePlans.length - 1}
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
fontSize: 22,
fontWeight: '700',
color: '#ffffff',
},
summarySubLabel: {
fontSize: 12,
color: 'rgba(255,255,255,0.7)',
fontWeight: '400',
marginTop: 2,
},
cardIconWrapper: {
width: 34,
height: 34,
borderRadius: 8,
alignItems: 'center',
justifyContent: 'center',
marginRight: 10,
},
});
