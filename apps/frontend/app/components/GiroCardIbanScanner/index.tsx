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
import { useTextRecognition } from '@/hooks/useTextRecognition';

/** Pause between two recognition passes. One pass itself takes about a second. */
const SCAN_PAUSE_IN_MS = 300;
/** Quality of the captured frame: enough detail for OCR, small enough to stay quick. */
const SCAN_PICTURE_QUALITY = 0.8;

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
 * Instead of a shutter button the preview is sampled continuously: a frame is
 * captured, run through on-device OCR and searched for an IBAN, then the next
 * one. The first hit ends the scan — the caller closes the sheet and fills its
 * input field.
 */
export const GiroCardIbanScanner: React.FC<GiroCardIbanScannerProps> = ({ onIbanDetected, allowInvalidChecksum, onRecognizedLinesChange }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const [permission, requestPermission] = useCameraPermissions();
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isTorchEnabled, setIsTorchEnabled] = useState(false);
	const [hasRecognizedOnce, setHasRecognizedOnce] = useState(false);

	const { recognizeLines, progress, errorMessage, engineElement } = useTextRecognition();

	const cameraRef = useRef<CameraView>(null);
	/** Set once the IBAN is found, so the loop stops and no second hit is reported. */
	const isFinishedRef = useRef(false);

	const isPermissionGranted = permission?.granted === true;
	const isPermissionPending = permission === null;

	const scanOnce = useCallback(async (): Promise<boolean> => {
		const camera = cameraRef.current;
		if (!camera) {
			return false;
		}
		// No `skipProcessing`: it hands back the frame in the sensor's own
		// orientation, and text lying on its side is text the engine cannot read.
		const picture = await camera.takePictureAsync({
			quality: SCAN_PICTURE_QUALITY,
			exif: false,
			shutterSound: false,
		});
		if (!picture?.uri) {
			return false;
		}
		const lines = await recognizeLines({ uri: picture.uri, width: picture.width });
		setHasRecognizedOnce(true);
		onRecognizedLinesChange?.(lines);
		const candidate = IbanRecognitionHelper.findIban(lines, { allowInvalidChecksum });
		if (!candidate) {
			return false;
		}
		onIbanDetected(candidate);
		return true;
	}, [allowInvalidChecksum, onIbanDetected, onRecognizedLinesChange, recognizeLines]);

	useEffect(() => {
		if (!isCameraReady || !isPermissionGranted) {
			return;
		}

		let isCancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
			} catch {
				// A single pass can fail for harmless reasons (the preview was
				// backgrounded, the engine was still warming up). The hook reports
				// what went wrong; keep scanning.
			}
			if (!isCancelled) {
				timeoutId = setTimeout(() => {
					void runScanLoop();
				}, SCAN_PAUSE_IN_MS);
			}
		};

		void runScanLoop();

		return () => {
			isCancelled = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isCameraReady, isPermissionGranted, scanOnce]);

	if (!isPermissionGranted) {
		return (
			<View style={styles.container}>
				<View style={styles.hintContainer}>
					<MaterialCommunityIcons name="camera-off-outline" size={40} color={theme.screen.icon} />
					<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.giro_card_scan_permission_required)}</Text>
				</View>
				{!isPermissionPending && (
					<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={requestPermission} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.friendships_allow_camera)}>
						<MaterialCommunityIcons name="camera" size={20} color={contrastColor} />
						<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.friendships_allow_camera)}</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}

	// The engine is fetched on first use, which is the slow part of the first
	// pass; say so instead of leaving the user in front of a silent preview.
	// Once a pass has come back, the engine is there and every later gap between
	// passes is just the scanner working.
	let statusText = translate(TranslationKeys.giro_card_scan_searching);
	if (progress !== null) {
		statusText = `${statusText} ${Math.round(progress * 100)} %`;
	} else if (!hasRecognizedOnce) {
		statusText = translate(TranslationKeys.giro_card_scan_preparing);
	}

	return (
		<View style={styles.container}>
			{engineElement}
			<View style={[styles.cameraWrapper, { borderColor: primaryColor }]}>
				<CameraView ref={cameraRef} style={styles.camera} facing="back" animateShutter={false} enableTorch={isTorchEnabled} onCameraReady={() => setIsCameraReady(true)} />
				<View pointerEvents="none" style={[styles.cardFrame, { borderColor: contrastColor }]} />
			</View>
			<View style={styles.statusRow}>
				<ActivityIndicator size="small" color={primaryColor} />
				<Text style={[styles.statusText, { color: theme.screen.text }]}>{statusText}</Text>
			</View>
			<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.giro_card_scan_hint)}</Text>
			<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => setIsTorchEnabled((enabled) => !enabled)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.giro_card_scan_toggle_torch)}>
				<MaterialCommunityIcons name={isTorchEnabled ? 'flashlight-off' : 'flashlight'} size={20} color={contrastColor} />
				<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.giro_card_scan_toggle_torch)}</Text>
			</TouchableOpacity>
			{Boolean(errorMessage) && (
				<>
					<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.giro_card_scan_engine_failed)}</Text>
					<Text style={[styles.errorText, { color: theme.screen.text }]}>{errorMessage}</Text>
				</>
			)}
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
