import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import ProjectButton from '@/components/ProjectButton';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

/** Shown first: the status the university reported at the last login via "Uni/Hochschule". */
const DEFAULT_PATH = '/university-affiliation';

type ApiResponse = {
	url: string;
	status: number | null;
	body: string;
};

function formatBody(text: string): string {
	try {
		return JSON.stringify(JSON.parse(text), null, 2);
	} catch {
		return text;
	}
}

/**
 * Experimental: sends a GET request to a path of the backend with the access token of the logged-in
 * user and shows the answer as formatted JSON, e.g. `/university-affiliation` or `/users/me`.
 */
const ApiRequest = () => {
	useSetPageTitle(TranslationKeys.api_request);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const [path, setPath] = useState(DEFAULT_PATH);
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<ApiResponse | null>(null);

	const sendRequest = useCallback(async () => {
		const normalizedPath = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`;
		const url = `${ServerAPI.getServerUrl()}${normalizedPath}`;
		setLoading(true);
		try {
			const token = await ServerAPI.getValidAccessToken();
			const result = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
			setResponse({ url, status: result.status, body: formatBody(await result.text()) });
		} catch (error) {
			setResponse({ url, status: null, body: String(error) });
		} finally {
			setLoading(false);
		}
	}, [path]);

	return (
		<ScrollView style={{ backgroundColor: theme.screen.background }} contentContainerStyle={styles.container}>
			<Text style={[styles.label, { color: theme.screen.text }]}>{translate(TranslationKeys.api_request_path)}</Text>
			<View style={styles.row}>
				<Text style={[styles.serverUrl, { color: theme.screen.text }]} numberOfLines={1}>
					{ServerAPI.getServerUrl()}
				</Text>
				<TextInput
					value={path}
					onChangeText={setPath}
					onSubmitEditing={() => void sendRequest()}
					autoCapitalize="none"
					autoCorrect={false}
					accessibilityLabel={translate(TranslationKeys.api_request_path)}
					style={[styles.input, { color: theme.screen.text, borderColor: theme.screen.icon }]}
				/>
			</View>
			<ProjectButton
				text={loading ? translate(TranslationKeys.loading) : translate(TranslationKeys.api_request_send)}
				onPress={() => void sendRequest()}
				style={styles.button}
			/>
			{response && (
				<View style={styles.result}>
					<Text style={[styles.meta, { color: theme.screen.text }]} selectable>
						{`GET ${response.url}`}
					</Text>
					<Text style={[styles.meta, { color: theme.screen.text }]}>{response.status === null ? translate(TranslationKeys.error) : `HTTP ${response.status}`}</Text>
					<Text style={[styles.json, { color: theme.screen.text, borderColor: theme.screen.icon }]} selectable>
						{response.body}
					</Text>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 12,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
	},
	row: {
		flexDirection: 'column',
		gap: 4,
	},
	serverUrl: {
		fontSize: 12,
		opacity: 0.7,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
		fontFamily: 'monospace',
	},
	button: {
		alignSelf: 'flex-start',
	},
	result: {
		gap: 6,
	},
	meta: {
		fontSize: 13,
		fontFamily: 'monospace',
	},
	json: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 13,
		fontFamily: 'monospace',
	},
});

export default ApiRequest;
