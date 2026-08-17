import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { areExpoUpdatesAvailable } from 'repo-depkit-common-ui';
import { getCompanyLogoLocalSaved } from '../config';

interface ExpoUpdateLoaderProps {
	children?: React.ReactNode;
}

const TIMEOUT_MS = 10000;
const IS_SMARTPHONE = Platform.OS === 'ios' || Platform.OS === 'android';

function createTimeoutPromise(ms: number): Promise<null> {
	return new Promise<null>(resolve => setTimeout(() => resolve(null), ms));
}

/**
 * Blocks the very first render behind a branded loading screen while checking
 * for (and applying) an OTA update, so a cold app start always runs the latest
 * published code instead of only picking it up on the next-next launch (which
 * is all expo-updates' native default gives you). Mirrors the score-tracker
 * ExpoUpdateLoader; web and Expo Go/dev builds skip the check entirely (no
 * update channel there) via areExpoUpdatesAvailable().
 */
const ExpoUpdateLoader: React.FC<ExpoUpdateLoaderProps> = ({ children }) => {
	const [loading, setLoading] = useState<boolean>(IS_SMARTPHONE);
	const [status, setStatus] = useState('Suche nach Updates...');
	const [showCancel, setShowCancel] = useState(false);
	const cancelUpdateRef = useRef(false);

	useEffect(() => {
		async function loadUpdates() {
			if (!IS_SMARTPHONE || !areExpoUpdatesAvailable()) {
				setLoading(false);
				return;
			}

			const timeoutPromise = createTimeoutPromise(TIMEOUT_MS);

			try {
				setStatus('Suche nach Updates...');
				const update = (await Promise.race([Updates.checkForUpdateAsync(), timeoutPromise])) as Awaited<
					ReturnType<typeof Updates.checkForUpdateAsync>
				> | null;

				if (cancelUpdateRef.current) return;
				if (!update?.isAvailable) {
					setLoading(false);
					return;
				}

				setStatus('Update wird heruntergeladen...');
				const fetchResult = await Promise.race([Updates.fetchUpdateAsync(), timeoutPromise]);

				if (cancelUpdateRef.current) return;
				if (fetchResult) {
					await Updates.reloadAsync();
				}
			} catch (e) {
				console.warn('[ExpoUpdateLoader] Error while applying updates:', e);
			} finally {
				setLoading(false);
			}
		}

		loadUpdates();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => setShowCancel(true), 3000);
		return () => clearTimeout(timer);
	}, []);

	const handleCancel = () => {
		cancelUpdateRef.current = true;
		setLoading(false);
	};

	if (!loading) {
		return <>{children}</>;
	}

	return (
		<View style={styles.container}>
			<Image source={getCompanyLogoLocalSaved()} style={styles.logo} resizeMode="contain" />
			<View style={styles.bottomContainer}>
				{showCancel && (
					<TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
						<Text style={styles.cancelLabel}>Abbrechen</Text>
					</TouchableOpacity>
				)}
				<Text style={styles.title}>{status}</Text>
				<ActivityIndicator size="large" style={styles.spinner} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	logo: {
		width: 160,
		height: 160,
		marginBottom: 20,
	},
	bottomContainer: {
		position: 'absolute',
		bottom: 40,
		left: 0,
		right: 0,
		flexDirection: 'column-reverse',
		alignItems: 'center',
	},
	spinner: {
		marginBottom: 15,
	},
	title: {
		fontSize: 16,
		marginBottom: 10,
	},
	cancelButton: {
		width: 200,
		height: 45,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 10,
		marginTop: 20,
	},
	cancelLabel: {
		fontSize: 16,
	},
});

export default ExpoUpdateLoader;
