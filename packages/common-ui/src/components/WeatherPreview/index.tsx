import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchWeatherAtCoordinates, interpolateTranslation, WeatherCondition, WeatherResult } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';

/**
 * Every user-facing text of the component.
 *
 * The component is translation-agnostic on purpose: the consuming app resolves its own
 * translation keys and hands the finished strings down, so `repo-depkit-common-ui` never
 * ships a hardcoded language. `WEATHER_PREVIEW_FALLBACK_TEXTS` covers the playbook and
 * other non-localised call sites.
 */
export interface WeatherPreviewTexts {
	/** Shown while the forecast is being fetched. */
	loading: string;
	/** Shown when no forecast could be fetched. */
	noDataAvailable: string;
	/** Label of the retry button in the no-data state. */
	retry: string;
	/** Condition label per weather condition, e.g. `{ sunny: 'Sonnig', ... }`. */
	conditions: Record<WeatherCondition, string>;
	/**
	 * Wind line, with `{{speed}}` replaced by the rounded wind speed in km/h,
	 * e.g. `'Wind {{speed}} km/h'`.
	 */
	wind: string;
}

export interface WeatherPreviewProps {
	/** User-facing texts. Defaults to the English {@link WEATHER_PREVIEW_FALLBACK_TEXTS}. */
	texts?: WeatherPreviewTexts;
	/** Latitude of the GPS coordinate to fetch the weather for. */
	latitude: number;
	/** Longitude of the GPS coordinate to fetch the weather for. */
	longitude: number;
	/**
	 * Optional point in time: unix epoch milliseconds or an ISO date string
	 * (e.g. "2026-08-14T09:30:00Z"). Empty/omitted fetches the current weather.
	 */
	time?: number | string;
	/** Accent color for the condition icon. Defaults to the primary blue. */
	accentColor?: string;
	nativeID?: string;
}

const CONDITION_ICONS: Record<WeatherCondition, keyof typeof MaterialCommunityIcons.glyphMap> = {
	sunny: 'weather-sunny',
	partly_cloudy: 'weather-partly-cloudy',
	cloudy: 'weather-cloudy',
	foggy: 'weather-fog',
	rainy: 'weather-rainy',
	snowy: 'weather-snowy',
	stormy: 'weather-lightning',
};

/**
 * English fallback so the component renders something sensible without a `texts` prop
 * (playbook, screenshots, prototypes). Apps must pass their own translated texts.
 */
export const WEATHER_PREVIEW_FALLBACK_TEXTS: WeatherPreviewTexts = {
	loading: 'Loading weather…',
	noDataAvailable: 'No weather data available',
	retry: 'Retry',
	wind: 'Wind {{speed}} km/h',
	conditions: {
		sunny: 'Sunny',
		partly_cloudy: 'Partly cloudy',
		cloudy: 'Cloudy',
		foggy: 'Foggy',
		rainy: 'Rainy',
		snowy: 'Snowy',
		stormy: 'Stormy',
	},
};

function parseTimeProp(time: number | string | undefined): number | undefined {
	if (time === undefined || time === '') return undefined;
	if (typeof time === 'number') return time;
	const numeric = Number(time);
	if (Number.isFinite(numeric) && numeric > 0) return numeric;
	const parsed = Date.parse(time);
	return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Displays the weather (temperature + condition) for a GPS coordinate and an
 * optional point in time, fetched from the free, key-less Open-Meteo API via
 * `fetchWeatherAtCoordinates` from repo-depkit-common. Fetching is
 * best-effort: on failure a neutral "no weather data" state with a retry
 * button is shown.
 */
export default function WeatherPreview({
	texts = WEATHER_PREVIEW_FALLBACK_TEXTS,
	latitude,
	longitude,
	time,
	accentColor = '#2563eb',
	nativeID,
}: Readonly<WeatherPreviewProps>) {
	const { theme } = useTheme();
	const [loading, setLoading] = useState(true);
	const [weather, setWeather] = useState<WeatherResult | null>(null);
	const [refreshCounter, setRefreshCounter] = useState(0);

	const timeMs = parseTimeProp(time);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setWeather(null);
		fetchWeatherAtCoordinates({ latitude, longitude, time: timeMs }).then((result) => {
			if (cancelled) return;
			setWeather(result);
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [latitude, longitude, timeMs, refreshCounter]);

	const handleRetry = useCallback(() => {
		setRefreshCounter((c) => c + 1);
	}, []);

	if (loading) {
		return (
			<View nativeID={nativeID} style={[styles.container, { borderColor: theme.screen.placeholder }]}>
				<ActivityIndicator color={accentColor} />
				<Text style={[styles.secondaryText, { color: theme.screen.placeholder }]}>{texts.loading}</Text>
			</View>
		);
	}

	if (!weather) {
		return (
			<View nativeID={nativeID} style={[styles.container, { borderColor: theme.screen.placeholder }]}>
				<MaterialCommunityIcons name="weather-cloudy-alert" size={28} color={theme.screen.placeholder} />
				<Text style={[styles.secondaryText, { color: theme.screen.placeholder }]}>{texts.noDataAvailable}</Text>
				<TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
					<Text style={[styles.retryText, { color: accentColor }]}>{texts.retry}</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View nativeID={nativeID} style={[styles.container, { borderColor: theme.screen.placeholder }]}>
			<MaterialCommunityIcons name={CONDITION_ICONS[weather.condition]} size={40} color={accentColor} />
			<Text style={[styles.temperatureText, { color: theme.screen.text }]}>
				{Math.round(weather.temperatureCelsius * 10) / 10} °C
			</Text>
			<Text style={[styles.conditionText, { color: theme.screen.text }]}>{texts.conditions[weather.condition]}</Text>
			{weather.windSpeedKmh !== null && (
				<Text style={[styles.secondaryText, { color: theme.screen.placeholder }]}>
					{interpolateTranslation(texts.wind, { speed: Math.round(weather.windSpeedKmh) })}
				</Text>
			)}
			<Text style={[styles.secondaryText, { color: theme.screen.placeholder }]}>
				{new Date(weather.timestamp).toLocaleString()}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: 4,
		paddingVertical: 16,
		paddingHorizontal: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 12,
	},
	temperatureText: {
		fontSize: 28,
		fontWeight: '700',
	},
	conditionText: {
		fontSize: 15,
		fontWeight: '600',
	},
	secondaryText: {
		fontSize: 13,
	},
	retryText: {
		fontSize: 14,
		fontWeight: '600',
		marginTop: 4,
	},
});
