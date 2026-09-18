import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import type { RecognitionImage, RecognitionResult } from '@/helper/TextRecognitionShared';

/** Pause between two passes over the live preview. */
const SCAN_PAUSE_IN_MS = 300;
/** Quality of the captured frame: enough detail to read, small enough to stay quick. */
const CAPTURE_QUALITY = 0.8;

export interface OcrCameraProps {
	/** Reads one frame. Comes from the engine the caller already holds. */
	recognizeImage: (image: RecognitionImage) => Promise<RecognitionResult>;
	/**
	 * Sampling the live preview until something is found, rather than waiting for
	 * the shutter. Only offered when the caller gave something to look for.
	 */
	isAutomatic: boolean;
	/** Handed every reading. Returning true ends the scan. */
	onRecognized: (lines: string[]) => boolean;
	/** What to hold in front of the camera, in the caller's words. */
	hint?: string;
	/** Whatever the engine has to say about itself, shown under the preview. */
	engineError?: string | null;
}

/**
 * A camera preview that hands every frame to an OCR engine.
 *
 * Taking the picture and reading it are separate jobs. The picture comes from
 * the platform's own camera (`expo-camera`) and from nothing else; the engine
 * gets a finished image and has no idea where it came from.
 *
 * Two ways in. With `isAutomatic` the preview is sampled continuously — capture,
 * read, ask the caller, next one — and the first hit ends it without the user
 * doing anything. Otherwise the shutter leads: one deliberate still, read on its
 * own, which is the better way to hold something steady because the frame stays
 * put while the engine works on it. While a still is up the preview is gone, not
 * merely covered: one picture is being looked at, and that is the one.
 */
export const OcrCamera: React.FC<OcrCameraProps> = ({ recognizeImage, isAutomatic, onRecognized, hint, engineError }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const [permission, requestPermission] = useCameraPermissions();
	const [isCameraReady, setIsCameraReady] = useState(false);
	const [isTorchEnabled, setIsTorchEnabled] = useState(false);
	const [facing, setFacing] = useState<CameraType>('back');
	const [hasReadOnce, setHasReadOnce] = useState(false);
	/** The still the shutter took, held on screen while it is read. */
	const [capturedImage, setCapturedImage] = useState<RecognitionImage | null>(null);
	const [isCapturedImageRead, setIsCapturedImageRead] = useState(false);
	/** True when the last frame was too soft for the engine to make anything of. */
	const [isTooBlurry, setIsTooBlurry] = useState(false);

	const cameraRef = useRef<CameraView>(null);
	/** Set once the caller is satisfied, so the loop stops and nothing is reported twice. */
	const isFinishedRef = useRef(false);

	const isPermissionGranted = permission?.granted === true;
	const isPermissionPending = permission === null;
	const isCameraActive = capturedImage === null;

	const takePicture = useCallback(async (): Promise<RecognitionImage | null> => {
		const camera = cameraRef.current;
		if (!camera) {
			return null;
		}
		// No `skipProcessing`: it hands back the frame in the sensor's own
		// orientation, and text lying on its side is text no engine can read.
		const picture = await camera.takePictureAsync({ quality: CAPTURE_QUALITY, exif: false, shutterSound: false });
		if (!picture?.uri) {
			return null;
		}
		return { uri: picture.uri, width: picture.width };
	}, []);

	/** Reads one image and asks the caller whether that was it. */
	const readImage = useCallback(
		async (image: RecognitionImage): Promise<boolean> => {
			const result = await recognizeImage(image);
			setIsTooBlurry(result.tooBlurry);
			if (result.lines.length === 0) {
				return false;
			}
			setHasReadOnce(true);
			if (!onRecognized(result.lines)) {
				return false;
			}
			isFinishedRef.current = true;
			return true;
		},
		[onRecognized, recognizeImage],
	);

	/** The still this component is reading right now, so it reads it only once. */
	const stillBeingReadRef = useRef<RecognitionImage | null>(null);
	/** The latest `readImage`, so a new one does not restart a running read. */
	const readImageRef = useRef(readImage);
	useEffect(() => {
		readImageRef.current = readImage;
	}, [readImage]);

	/**
	 * The shutter, and nothing more: it takes the picture and puts it on screen.
	 * Reading it is a separate step below.
	 */
	const capturePicture = useCallback(async () => {
		const image = await takePicture();
		if (!image) {
			return;
		}
		setIsCapturedImageRead(false);
		setCapturedImage(image);
	}, [takePicture]);

	const discardCapturedImage = useCallback(() => {
		stillBeingReadRef.current = null;
		setCapturedImage(null);
		setIsCapturedImageRead(false);
		setIsCameraReady(false);
		setIsTooBlurry(false);
	}, []);

	useEffect(() => {
		if (capturedImage === null || stillBeingReadRef.current === capturedImage) {
			return;
		}
		stillBeingReadRef.current = capturedImage;

		const readCapturedImage = async () => {
			try {
				await readImageRef.current(capturedImage);
			} catch {
				// The engine reports what went wrong; the still stays up so the user
				// can try again without hunting for the subject a second time.
			}
			if (stillBeingReadRef.current === capturedImage) {
				setIsCapturedImageRead(true);
			}
		};
		void readCapturedImage();
	}, [capturedImage]);

	useEffect(() => {
		// While a still is on screen the loop stands down: that frame is the one
		// the user picked, and a second reading would only compete with it.
		if (!isAutomatic || !isCameraReady || !isPermissionGranted || capturedImage !== null) {
			return;
		}

		let isCancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const runScanLoop = async () => {
			if (isCancelled || isFinishedRef.current) {
				return;
			}
			try {
				const image = await takePicture();
				if (image && (await readImage(image))) {
					return;
				}
			} catch {
				// A single pass can fail for harmless reasons (the preview was
				// backgrounded, the engine was still warming up). Keep scanning.
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
	}, [capturedImage, isAutomatic, isCameraReady, isPermissionGranted, readImage, takePicture]);

	if (!isPermissionGranted) {
		return (
			<View style={styles.container}>
				<View style={styles.hintContainer}>
					<MaterialCommunityIcons name="camera-off-outline" size={40} color={theme.screen.icon} />
					<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.ocr_camera_permission_required)}</Text>
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

	const isReadingCapturedImage = capturedImage !== null && !isCapturedImageRead;
	let statusText = translate(TranslationKeys.ocr_searching);
	if (!hasReadOnce) {
		// Loading the engine is the slow part of the first pass; say so instead of
		// leaving the user in front of a silent preview.
		statusText = translate(TranslationKeys.ocr_preparing);
	}
	if (!isAutomatic && isCameraActive) {
		statusText = translate(TranslationKeys.ocr_ready_for_photo);
	}
	if (capturedImage !== null && isCapturedImageRead) {
		statusText = translate(TranslationKeys.ocr_nothing_in_photo);
	}
	// A frame too soft to read is the common case on a front camera, which cannot
	// focus at the distance something is held at. Say so rather than searching on.
	if (isTooBlurry) {
		statusText = translate(TranslationKeys.ocr_too_blurry);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.cameraWrapper, { borderColor: primaryColor }]}>
				{/* One or the other, never both: the still replaces the preview
				    rather than covering it, so no camera is left running underneath
				    while the engine reads. */}
				{isCameraActive ? <CameraView ref={cameraRef} style={styles.camera} facing={facing} animateShutter={false} enableTorch={isTorchEnabled} onCameraReady={() => setIsCameraReady(true)} /> : <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} resizeMode="cover" accessibilityLabel={translate(TranslationKeys.ocr_take_photo)} />}
				<View pointerEvents="none" style={[styles.frame, { borderColor: contrastColor }]} />
			</View>

			<View style={styles.statusRow}>
				{(isReadingCapturedImage || (isCameraActive && isAutomatic)) && <ActivityIndicator size="small" color={primaryColor} />}
				<Text style={[styles.statusText, { color: theme.screen.text }]}>{statusText}</Text>
			</View>
			{hint !== undefined && <Text style={[styles.hintText, { color: theme.screen.text }]}>{hint}</Text>}

			{isCameraActive ? (
				<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => void capturePicture()} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.ocr_take_photo)}>
					<MaterialCommunityIcons name="camera-iris" size={20} color={contrastColor} />
					<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.ocr_take_photo)}</Text>
				</TouchableOpacity>
			) : (
				<TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={discardCapturedImage} disabled={isReadingCapturedImage} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.ocr_retry)}>
					<MaterialCommunityIcons name="camera-retake-outline" size={20} color={contrastColor} />
					<Text style={[styles.actionButtonText, { color: contrastColor }]}>{translate(TranslationKeys.ocr_retry)}</Text>
				</TouchableOpacity>
			)}

			<View style={styles.secondaryRow}>
				<TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.screen.icon }]} onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.ocr_switch_camera)}>
					<MaterialCommunityIcons name="camera-flip-outline" size={20} color={theme.screen.icon} />
					<Text style={[styles.secondaryButtonText, { color: theme.screen.text }]}>{translate(TranslationKeys.ocr_switch_camera)}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.screen.icon }]} onPress={() => setIsTorchEnabled((enabled) => !enabled)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.ocr_toggle_torch)}>
					<MaterialCommunityIcons name={isTorchEnabled ? 'flashlight-off' : 'flashlight'} size={20} color={theme.screen.icon} />
					<Text style={[styles.secondaryButtonText, { color: theme.screen.text }]}>{translate(TranslationKeys.ocr_toggle_torch)}</Text>
				</TouchableOpacity>
			</View>

			{engineError !== null && engineError !== undefined && (
				<View style={styles.failureContainer}>
					<MaterialCommunityIcons name="alert-circle-outline" size={40} color={theme.screen.icon} />
					<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.ocr_engine_failed)}</Text>
					<Text selectable style={[styles.errorText, { color: theme.screen.text }]}>
						{engineError}
					</Text>
				</View>
			)}
		</View>
	);
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
		// Capped, because a modal on a desktop browser is as wide as the window:
		// an uncapped preview pushes the status line and the buttons below the
		// fold, and the reading nobody can see is the reading nobody gets.
		maxWidth: 420,
		alignSelf: 'center',
		aspectRatio: 16 / 10,
		borderRadius: 12,
		borderWidth: 2,
		overflow: 'hidden',
	},
	camera: {
		width: '100%',
		height: '100%',
	},
	capturedImage: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	frame: {
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
	failureContainer: {
		width: '100%',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 16,
	},
	hintText: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
	},
	errorText: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		opacity: 0.8,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		paddingHorizontal: 18,
		height: 44,
	},
	actionButtonText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	secondaryRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 10,
	},
	secondaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 14,
		height: 40,
	},
	secondaryButtonText: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
	},
});

export default OcrCamera;
