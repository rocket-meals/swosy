import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IbanCandidate, IbanRecognitionHelper } from 'repo-depkit-common';

import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { isTextRecognitionSupported, recognizeTextLines } from '@/helper/TextRecognitionHelper';

/** Milliseconds between two frames handed to the text recognizer. */
const SCAN_INTERVAL_IN_MS = 900;
/** Quality of the captured frame: enough detail for OCR, small enough to stay quick. */
const SCAN_PICTURE_QUALITY = 0.6;

export interface GiroCardIbanScannerProps {
	/** Called with the IBAN as soon as it is recognized. */
	onIbanDetected: (candidate: IbanCandidate) => void;
	/**
	 * Accept an IBAN whose mod-97 checksum does not add up. Only for testing
	 * against specimen cards such as the fixture in
	 * `packages/common/src/__tests__/fixtures/girocard` — a real card always
	 * carries a checksum-valid IBAN, and demanding it filters out misreads.
	 */
	allowInvalidChecksum?: boolean;
	/** Every batch of recognized lines, for the experimental screen's debug output. */
	onRecognizedLinesChange?: (lines: string[]) => void;
}

/**
 * Camera preview that reads the IBAN off a giro card.
 *
 * Instead of a shutter button the preview is sampled continuously: every
 * {@link SCAN_INTERVAL_IN_MS} a frame is captured, run through on-device OCR and
 * searched for an IBAN. The first hit ends the scan — the caller closes the
 * sheet and fills its input field.
 */
export const GiroCardIbanScanner: React.FC<GiroCardIbanScannerProps> = ({ onIbanDetected, allowInvalidChecksum, onRecognizedLinesChange }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const [permission, requestPermission] = useCameraPermissions();
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isTorchEnabled, setIsTorchEnabled] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const cameraRef = useRef<CameraView>(null);
	/** Set once the IBAN is found, so the loop stops and no second hit is reported. */
	const isFinishedRef = useRef(false);

	const recognitionSupported = isTextRecognitionSupported();
	const isPermissionGranted = permission?.granted === true;
	const canRequestPermission = permission !== null && !permission.granted;

	const scanOnce = useCallback(async (): Promise<boolean> => {
		const camera = cameraRef.current;
		if (!camera) {
			return false;
		}
		const picture = await camera.takePictureAsync({
			quality: SCAN_PICTURE_QUALITY,
			skipProcessing: true,
			shutterSound: false,
			exif: false,
		});
		if (!picture?.uri) {
			return false;
		}
		const lines = await recognizeTextLines(picture.uri);
		onRecognizedLinesChange?.(lines);
		const candidate = IbanRecognitionHelper.findIban(lines, { allowInvalidChecksum });
		if (!candidate) {
			return false;
		}
		onIbanDetected(candidate);
		return true;
	}, [allowInvalidChecksum, onIbanDetected, onRecognizedLinesChange]);

	useEffect(() => {
		if (!isCameraReady || !isPermissionGranted || !recognitionSupported) {
			return;
		}

		let isCancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const scheduleNextScan = () => {
			timeoutId = setTimeout(() => {
				void runScanLoop();
			}, SCAN_INTERVAL_IN_MS);
		};

		const runScanLoop = async () => {
			if (isCancelled || isFinishedRef.current) {
				return;
			}
			try {
				const isDone = await scanOnce();
				if (isDone) {
					isFinishedRef.current = true;
					return;
				}
				setErrorMessage(null);
			} catch (error) {
				// A single frame can fail for harmless reasons (the preview was
				// backgrounded, the shot was taken mid-focus). Keep scanning and
				// only tell the user what went wrong.
				setErrorMessage(error instanceof Error ? error.message : String(error));
			}
			if (!isCancelled) {
				scheduleNextScan();
			}
		};

		void runScanLoop();

		return () => {
			isCancelled = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isCameraReady, isPermissionGranted, recognitionSupported, scanOnce]);

	const renderHint = (iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'], message: string) => (
		<View style={styles.hintContainer}>
			<MaterialCommunityIcons name={iconName} size={40} color={theme.screen.icon} />
			<Text style={[styles.hintText, { color: theme.screen.text }]}>{message}</Text>
		</View>
	);

	if (!recognitionSupported) {
		return <View style={styles.container}>{renderHint('text-recognition', translate(TranslationKeys.giro_card_scan_unsupported))}</View>;
	}

	if (!isPermissionGranted) {
		return (
			<View style={styles.container}>
				{renderHint('camera-off-outline', translate(TranslationKeys.giro_card_scan_permission_required))}
				{canRequestPermission && (
					<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={requestPermission} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.friendships_allow_camera)}>
						<MaterialCommunityIcons name="camera" size={20} color={contrastColor} />
						<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.friendships_allow_camera)}</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.cameraWrapper, { borderColor: primaryColor }]}>
				<CameraView ref={cameraRef} style={styles.camera} facing="back" animateShutter={false} enableTorch={isTorchEnabled} onCameraReady={() => setIsCameraReady(true)} />
				<View pointerEvents="none" style={[styles.cardFrame, { borderColor: contrastColor }]} />
			</View>
			<View style={styles.statusRow}>
				<ActivityIndicator size="small" color={primaryColor} />
				<Text style={[styles.statusText, { color: theme.screen.text }]}>{translate(TranslationKeys.giro_card_scan_searching)}</Text>
			</View>
			<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.giro_card_scan_hint)}</Text>
			<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => setIsTorchEnabled((enabled) => !enabled)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.giro_card_scan_toggle_torch)}>
				<MaterialCommunityIcons name={isTorchEnabled ? 'flashlight-off' : 'flashlight'} size={20} color={contrastColor} />
				<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.giro_card_scan_toggle_torch)}</Text>
			</TouchableOpacity>
			{Boolean(errorMessage) && <Text style={[styles.errorText, { color: theme.screen.text }]}>{errorMessage}</Text>}
		</View>
	);
};

export interface OpenGiroCardIbanScannerOptions {
	/** Receives the IBAN grouped in blocks of four, ready for the input field. */
	onIbanDetected: (formattedIban: string, candidate: IbanCandidate) => void;
	allowInvalidChecksum?: boolean;
	onRecognizedLinesChange?: (lines: string[]) => void;
}

/**
 * Opens the scanner in a scroll-view modal and closes it again the moment an
 * IBAN is recognized, so the caller's input field is already filled when the
 * sheet is gone.
 */
export const useGiroCardIbanScannerModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const openGiroCardIbanScanner = useCallback(
		(options: OpenGiroCardIbanScannerOptions) => {
			show({
				title: translate(TranslationKeys.giro_card_scan_title),
				onClose: close,
				children: (
					<GiroCardIbanScanner
						allowInvalidChecksum={options.allowInvalidChecksum}
						onRecognizedLinesChange={options.onRecognizedLinesChange}
						onIbanDetected={(candidate) => {
							close();
							options.onIbanDetected(candidate.formatted, candidate);
						}}
					/>
				),
			});
		},
		[close, show, translate],
	);

	return { openGiroCardIbanScanner, closeGiroCardIbanScanner: close };
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 8,
	},
	cameraWrapper: {
		width: '100%',
		aspectRatio: 16 / 10,
		borderRadius: 12,
		borderWidth: 2,
		overflow: 'hidden',
	},
	camera: {
		width: '100%',
		height: '100%',
	},
	cardFrame: {
		position: 'absolute',
		top: '18%',
		left: '8%',
		right: '8%',
		bottom: '18%',
		borderWidth: 2,
		borderRadius: 10,
		opacity: 0.7,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	statusText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	hintContainer: {
		alignItems: 'center',
		gap: 12,
		paddingVertical: 16,
	},
	hintText: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		borderRadius: 10,
		paddingHorizontal: 18,
		height: 43,
	},
	actionButtonText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	errorText: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		opacity: 0.7,
	},
});

export default GiroCardIbanScanner;
