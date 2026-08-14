import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const SUCCESS_COLOR = '#16a34a';

/**
 * Export modal body shared by every "… exportieren" row (Partie, Spiel,
 * Freunde): explains what the export contains, and offers the two ways to
 * hand it over - copy to the clipboard (with visible success feedback, the
 * copy itself gives none) or the platform share sheet (iOS/Android then ask
 * where to send it, e.g. WhatsApp).
 */
export default function ShareExportContent({ text, info }: Readonly<{ text: string; info: string }>) {
	const { theme } = useTheme();
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCopy = useCallback(async () => {
		try {
			await Clipboard.setStringAsync(text);
			setCopied(true);
			setError(null);
		} catch {
			setCopied(false);
			setError('Kopieren in die Zwischenablage hat nicht geklappt.');
		}
	}, [text]);

	const handleShare = useCallback(async () => {
		try {
			await Share.share({ message: text });
			setError(null);
		} catch {
			// E.g. web without navigator.share, or the user's platform has no
			// share sheet - the clipboard button above always keeps working.
			setError('Teilen wird auf diesem Gerät nicht unterstützt - nutze „In Zwischenablage kopieren“.');
		}
	}, [text]);

	return (
		<View style={styles.container}>
			<Text style={[styles.hint, { color: theme.screen.placeholder }]}>{info}</Text>
			<TouchableOpacity
				id={ComponentIds.SHARE_EXPORT_COPY_BUTTON}
				style={[styles.primaryButton, { backgroundColor: copied ? SUCCESS_COLOR : PRIMARY_COLOR }]}
				onPress={handleCopy}
				activeOpacity={0.8}
			>
				<Ionicons name={copied ? 'checkmark-circle-outline' : 'copy-outline'} size={18} color="#ffffff" />
				<Text style={styles.primaryButtonText}>{copied ? 'Erfolgreich kopiert' : 'In Zwischenablage kopieren'}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				id={ComponentIds.SHARE_EXPORT_SHARE_BUTTON}
				style={[styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]}
				onPress={handleShare}
				activeOpacity={0.8}
			>
				<Ionicons name="share-outline" size={18} color="#ffffff" />
				<Text style={styles.primaryButtonText}>Teilen …</Text>
			</TouchableOpacity>
			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
		gap: 10,
	},
	hint: {
		fontSize: 13,
		lineHeight: 19,
		paddingHorizontal: 4,
	},
	primaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 46,
		borderRadius: 10,
	},
	primaryButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 13,
		paddingHorizontal: 4,
	},
});
