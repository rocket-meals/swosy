import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SettingsList, SettingsListGroupTitle } from 'repo-depkit-common-ui';

const PRIMARY_COLOR = '#7c3aed';
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
  return {
    weekNum: getISOWeekNumber(targetDate),
    year: getISOWeekYear(targetDate),
  };
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const [showPastWeeks, setShowPastWeeks] = useState(false);

  const now = new Date();
  const currentWeek = getISOWeekNumber(now);
  const currentYear = getISOWeekYear(now);

  const pastWeeks = Array.from({ length: NUM_PAST_WEEKS }, (_, i) =>
    getISOWeekOffset(currentWeek, currentYear, -(NUM_PAST_WEEKS - i)),
  );

  const futureWeeks = Array.from({ length: NUM_FUTURE_WEEKS }, (_, i) =>
    getISOWeekOffset(currentWeek, currentYear, i + 1),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Load previous weeks */}
        <SettingsList
          title={showPastWeeks ? 'Vorherige Kalenderwochen ausblenden' : 'Vorherige Kalenderwochen laden'}
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

        {/* Past calendar weeks */}
        {showPastWeeks && pastWeeks.length > 0 && (
          <>
            <SettingsListGroupTitle title="Vergangene Kalenderwochen" />
            {pastWeeks.map(({ weekNum, year }, idx) => (
              <SettingsList
                key={`past-${weekNum}-${year}`}
                title={`KW ${weekNum} · ${year}`}
                iconBgColor={PRIMARY_COLOR}
                leftIcon={<Ionicons name="calendar-outline" size={20} color="#ffffff" />}
                groupPosition={
                  pastWeeks.length === 1
                    ? 'single'
                    : idx === 0
                    ? 'top'
                    : idx === pastWeeks.length - 1
                    ? 'bottom'
                    : 'middle'
                }
                showSeparator={idx < pastWeeks.length - 1}
              />
            ))}
          </>
        )}

        {/* Current calendar week */}
        <SettingsListGroupTitle title={`Aktuelle Kalenderwoche (KW ${currentWeek})`} />
        <SettingsList
          title="Aktuelle Challenge"
          iconBgColor={PRIMARY_COLOR}
          leftIcon={<Ionicons name="trophy-outline" size={20} color="#ffffff" />}
          groupPosition="single"
          showSeparator={false}
        />

        {/* Upcoming calendar weeks */}
        {futureWeeks.length > 0 && (
          <>
            <SettingsListGroupTitle title="Kommende Kalenderwochen" />
            {futureWeeks.map(({ weekNum, year }, idx) => (
              <SettingsList
                key={`future-${weekNum}-${year}`}
                title={`KW ${weekNum} · ${year}`}
                iconBgColor={PRIMARY_COLOR}
                leftIcon={<Ionicons name="calendar-outline" size={20} color="#ffffff" />}
                groupPosition={
                  futureWeeks.length === 1
                    ? 'single'
                    : idx === 0
                    ? 'top'
                    : idx === futureWeeks.length - 1
                    ? 'bottom'
                    : 'middle'
                }
                showSeparator={idx < futureWeeks.length - 1}
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
