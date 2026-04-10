import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SettingsList, SettingsListGroupTitle } from 'repo-depkit-common-ui';
import { useDebugMode } from '../../hooks/useDebugMode';

// ─── Colors ────────────────────────────────────────────────────────────────────

const COLOR_VOLUME = '#2563eb';
const COLOR_LONG_RUN = '#ea580c';
const COLOR_STABILIZATION = '#16a34a';
const COLOR_DELOAD = '#6b7280';

// ─── Challenge algorithm ────────────────────────────────────────────────────────

type ChallengeType = 'volume' | 'long-run' | 'stabilization' | 'deload';

interface PrevState {
  totalKm: number;
  longestKm: number;
}

interface WeekChallenge {
  type: ChallengeType;
  totalKm: number;
  longestKm: number;
  debugInfo: string;
}

/** Baseline state for the week before KW 1 (seeds the algorithm). */
const BASELINE: PrevState = { totalKm: 20, longestKm: 8 };

/** Round to the nearest 0.5 km increment. */
function roundToHalf(km: number): number {
  return Math.round(km * 2) / 2;
}

/**
 * Compute the challenge for a given week index (1 = KW 1 of the year).
 * Returns the challenge description and the resulting state to carry forward.
 *
 * Cycle structure (repeating 4-week blocks, 8-week super-cycle):
 *   weekIndex % 4 === 1  → volume week
 *   weekIndex % 4 === 2  → long-run week
 *   weekIndex % 4 === 3  → stabilization week
 *   weekIndex % 4 === 0  → deload week
 *
 * The second 4-week block inside each 8-week cycle uses slightly higher
 * factors to reflect improved adaptation.
 */
function computeWeekChallenge(prev: PrevState, weekIndex: number): { challenge: WeekChallenge; next: PrevState } {
  const mod = weekIndex % 4;
  const posIn8 = ((weekIndex - 1) % 8) + 1; // 1–8
  const isSecondBlock = posIn8 >= 5;
  const MAX_WEEKLY_INCREASE_KM = 5;

  let type: ChallengeType;
  if (mod === 0) type = 'deload';
  else if (mod === 2) type = 'long-run';
  else if (mod === 3) type = 'stabilization';
  else type = 'volume';

  let newTotal: number;
  let newLongest: number;
  let debugInfo: string;

  switch (type) {
    case 'volume': {
      const pct = isSecondBlock ? 0.10 : 0.08;
      const increase = Math.min(prev.totalKm * pct, MAX_WEEKLY_INCREASE_KM);
      newTotal = roundToHalf(prev.totalKm + increase);
      const longestIncrease = isSecondBlock ? 0.03 : 0.02;
      newLongest = roundToHalf(Math.min(prev.longestKm * (1 + longestIncrease), newTotal * 0.40));
      debugInfo =
        `Block ${isSecondBlock ? '2' : '1'} | ` +
        `Gesamt: ${prev.totalKm} + ${increase.toFixed(1)} km (+${(pct * 100).toFixed(0)}%) = ${newTotal} km | ` +
        `Langer Lauf: ${prev.longestKm} × ${(1 + longestIncrease).toFixed(2)} = ${newLongest} km (max 40% von ${newTotal} km)`;
      break;
    }
    case 'long-run': {
      const pct = isSecondBlock ? 0.12 : 0.10;
      newLongest = roundToHalf(prev.longestKm * (1 + pct));
      const diff = newLongest - prev.longestKm;
      newTotal = roundToHalf(Math.min(prev.totalKm + diff, prev.totalKm + MAX_WEEKLY_INCREASE_KM));
      if (newLongest > newTotal * 0.40) {
        newTotal = roundToHalf(newLongest / 0.40);
      }
      debugInfo =
        `Block ${isSecondBlock ? '2' : '1'} | ` +
        `Langer Lauf: ${prev.longestKm} × ${(1 + pct).toFixed(2)} = ${newLongest} km (+${diff.toFixed(1)} km) | ` +
        `Gesamt: ${newTotal} km (Diff + Total, max +5 km, LR ≤ 40%)`;
      break;
    }
    case 'stabilization': {
      const pct = isSecondBlock ? 0.05 : 0.03;
      const increase = Math.min(prev.totalKm * pct, MAX_WEEKLY_INCREASE_KM);
      newTotal = roundToHalf(prev.totalKm + increase);
      newLongest = prev.longestKm;
      debugInfo =
        `Block ${isSecondBlock ? '2' : '1'} | ` +
        `Gesamt: ${prev.totalKm} + ${increase.toFixed(1)} km (+${(pct * 100).toFixed(0)}%) = ${newTotal} km | ` +
        `Langer Lauf: ${newLongest} km (unverändert)`;
      break;
    }
    case 'deload': {
      newTotal = roundToHalf(prev.totalKm * 0.75);
      newLongest = roundToHalf(prev.longestKm * 0.80);
      debugInfo =
        `Gesamt: ${prev.totalKm} × 0.75 = ${newTotal} km | ` +
        `Langer Lauf: ${prev.longestKm} × 0.80 = ${newLongest} km`;
      break;
    }
  }

  // Hard constraint: longest run must not exceed 40 % of total distance
  if (newLongest > newTotal * 0.40) {
    newLongest = roundToHalf(newTotal * 0.40);
  }

  const challenge: WeekChallenge = { type, totalKm: newTotal, longestKm: newLongest, debugInfo };
  const next: PrevState = { totalKm: newTotal, longestKm: newLongest };
  return { challenge, next };
}

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

/** Returns the number of ISO weeks in the given year (52 or 53). */
function getISOWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  return getISOWeekNumber(dec28);
}

// ─── Challenge config per type ─────────────────────────────────────────────────

function challengeConfig(type: ChallengeType): { label: string; iconName: string; color: string } {
  switch (type) {
    case 'volume':
      return { label: 'Volumen-Woche', iconName: 'trending-up-outline', color: COLOR_VOLUME };
    case 'long-run':
      return { label: 'Langer-Lauf-Woche', iconName: 'footsteps-outline', color: COLOR_LONG_RUN };
    case 'stabilization':
      return { label: 'Stabilisierungs-Woche', iconName: 'checkmark-circle-outline', color: COLOR_STABILIZATION };
    case 'deload':
      return { label: 'Deload-Woche', iconName: 'moon-outline', color: COLOR_DELOAD };
  }
}

// ─── Week row component ────────────────────────────────────────────────────────

interface WeekRowProps {
  weekNum: number;
  challenge: WeekChallenge;
  groupPosition: 'top' | 'middle' | 'bottom' | 'single';
  showSeparator: boolean;
  isDebug: boolean;
}

function WeekRow({ weekNum, challenge, groupPosition, showSeparator, isDebug }: WeekRowProps) {
  const { label, iconName, color } = challengeConfig(challenge.type);
  const titleText = isDebug
    ? `KW ${weekNum} · ${label}\n${challenge.debugInfo}`
    : `KW ${weekNum} · ${label}`;
  return (
    <SettingsList
      title={titleText}
      value={`${challenge.totalKm} km · LR ${challenge.longestKm} km`}
      iconBgColor={color}
      leftIcon={<Ionicons name={iconName as any} size={20} color="#ffffff" />}
      groupPosition={groupPosition}
      showSeparator={showSeparator}
    />
  );
}

function listGroupPosition(idx: number, total: number): 'top' | 'middle' | 'bottom' | 'single' {
  if (total === 1) return 'single';
  if (idx === 0) return 'top';
  if (idx === total - 1) return 'bottom';
  return 'middle';
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const isDebug = useDebugMode();
  const [showPastWeeks, setShowPastWeeks] = useState(false);

  const now = new Date();
  const currentWeek = getISOWeekNumber(now);
  const currentYear = getISOWeekYear(now);
  const totalWeeks = getISOWeeksInYear(currentYear);

  // Build challenge for every ISO week of the year (week indices 1 … totalWeeks)
  const weekChallenges = useMemo<WeekChallenge[]>(() => {
    const result: WeekChallenge[] = [];
    let state = BASELINE;
    for (let w = 1; w <= totalWeeks; w++) {
      const { challenge, next } = computeWeekChallenge(state, w);
      result.push(challenge);
      state = next;
    }
    return result;
  }, [totalWeeks]);

  // Split into past / current / future (week indices are 1-based, array is 0-based)
  const pastWeekNums = Array.from({ length: currentWeek - 1 }, (_, i) => i + 1);
  const futureWeekNums = Array.from({ length: totalWeeks - currentWeek }, (_, i) => currentWeek + 1 + i);
  const currentChallenge = weekChallenges[currentWeek - 1];
  const currentConfig = challengeConfig(currentChallenge.type);

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Toggle button for past weeks */}
        <SettingsList
          title={showPastWeeks ? 'Vorherige Kalenderwochen ausblenden' : 'Vorherige Kalenderwochen laden (bis KW 1)'}
          leftIcon={
            <Ionicons
              name={showPastWeeks ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#ffffff"
            />
          }
          iconBgColor="#6b7280"
          onPress={() => setShowPastWeeks((prev) => !prev)}
          groupPosition="single"
          showSeparator={false}
        />

        {/* Past calendar weeks (KW 1 … current-1) */}
        {showPastWeeks && pastWeekNums.length > 0 && (
          <>
            <SettingsListGroupTitle title="Vergangene Kalenderwochen" />
            {pastWeekNums.map((weekNum, idx) => (
              <WeekRow
                key={`past-${weekNum}`}
                weekNum={weekNum}
                challenge={weekChallenges[weekNum - 1]}
                groupPosition={listGroupPosition(idx, pastWeekNums.length)}
                showSeparator={idx < pastWeekNums.length - 1}
                isDebug={isDebug}
              />
            ))}
          </>
        )}

        {/* Current calendar week */}
        <SettingsListGroupTitle title={`Aktuelle Kalenderwoche (KW ${currentWeek})`} />
        <SettingsList
          title={
            isDebug
              ? `KW ${currentWeek} · ${currentConfig.label}\n${currentChallenge.debugInfo}`
              : `KW ${currentWeek} · ${currentConfig.label}`
          }
          value={`${currentChallenge.totalKm} km · LR ${currentChallenge.longestKm} km`}
          iconBgColor={currentConfig.color}
          leftIcon={<Ionicons name={currentConfig.iconName as any} size={20} color="#ffffff" />}
          groupPosition="single"
          showSeparator={false}
        />

        {/* Remaining calendar weeks (KW current+1 … end of year) */}
        {futureWeekNums.length > 0 && (
          <>
            <SettingsListGroupTitle title="Kommende Kalenderwochen" />
            {futureWeekNums.map((weekNum, idx) => (
              <WeekRow
                key={`future-${weekNum}`}
                weekNum={weekNum}
                challenge={weekChallenges[weekNum - 1]}
                groupPosition={listGroupPosition(idx, futureWeekNums.length)}
                showSeparator={idx < futureWeekNums.length - 1}
                isDebug={isDebug}
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
});
