import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { FriendshipsHelper } from '@/redux/actions/Friendships/Friendships';
import { ADD_FRIENDSHIP, UPDATE_FRIENDSHIP } from '@/redux/Types/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import useToast from '@/hooks/useToast';
import ProjectButton from '@/components/ProjectButton';
import DebugView from '@/components/DebugView';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';

const isWeb = Platform.OS === 'web';

/* ───────────────────────── Scan / Add Friend Modal ──────────────────────── */
type ScanPhase = 'scanning' | 'confirming' | 'error' | 'already_friends';

type ScanModalContentProps = {
	onSubmit: (id: string) => Promise<void>;
	checkAlreadyFriends?: (friendshipId: string) => Promise<boolean>;
	noCamera?: boolean;
};

const ScanModalContent: React.FC<ScanModalContentProps> = ({ onSubmit, checkAlreadyFriends, noCamera }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const [phase, setPhase] = useState<ScanPhase>('scanning');
	const [errorDetail, setErrorDetail] = useState<string>('');
	const scannedRef = useRef(false);
	const [permission, requestPermission] = useCameraPermissions();
	const [manualId, setManualId] = useState('');

	const handleSubmitId = useCallback(async (friendshipId: string) => {
		if (scannedRef.current) return;
		const id = friendshipId?.trim();
		if (!id || id.length < 1) return;
		scannedRef.current = true;
		setPhase('confirming');
		setErrorDetail('');
		try {
			if (checkAlreadyFriends) {
				const alreadyFriends = await checkAlreadyFriends(id);
				if (alreadyFriends) {
					setPhase('already_friends');
					return;
				}
			}
			await onSubmit(id);
		} catch (error: any) {
			const message = error?.message ?? error?.toString?.() ?? JSON.stringify(error);
			setErrorDetail(message);
			setPhase('error');
			scannedRef.current = false;
		}
	}, [onSubmit, checkAlreadyFriends]);

	const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
		await handleSubmitId(data);
	}, [handleSubmitId]);

	const handleScanAgain = useCallback(() => {
		scannedRef.current = false;
		setErrorDetail('');
		setPhase('scanning');
	}, []);

	const handleManualSubmit = useCallback(async () => {
		await handleSubmitId(manualId);
	}, [manualId, handleSubmitId]);

	const useCamera = !noCamera && !isWeb;
	const showCamera = useCamera && permission?.granted;
	const canRequestPermission = useCamera && permission && !permission.granted;

	if (phase === 'confirming') {
		return (
			<View style={scanStyles.container}>
				<View style={scanStyles.statusSection}>
					<ActivityIndicator size="large" color={primaryColor} />
					<Text style={[scanStyles.statusText, { color: theme.screen.text }]}>
						{translate(TranslationKeys.friendships_confirming)}
					</Text>
				</View>
			</View>
		);
	}

	if (phase === 'already_friends') {
		return (
			<View style={scanStyles.container}>
				<View style={scanStyles.statusSection}>
					<MaterialCommunityIcons name="account-check" size={48} color="#4CAF50" />
					<Text style={[scanStyles.statusText, { color: theme.screen.text }]}>
						{translate(TranslationKeys.friendships_already_friends)}
					</Text>
				</View>
			</View>
		);
	}

	if (phase === 'error') {
		return (
			<View style={scanStyles.container}>
				<View style={scanStyles.statusSection}>
					<MaterialCommunityIcons name="alert-circle-outline" size={48} color="#F44336" />
					<Text style={[scanStyles.statusText, { color: theme.screen.text }]}>
						{translate(TranslationKeys.friendships_scan_error_details)}
					</Text>
				</View>
				<DebugView
					title="Error"
					logs={errorDetail ? [errorDetail] : []}
					isVisible={true}
				/>
				<View style={scanStyles.buttonContainer}>
					<ProjectButton
						text={translate(TranslationKeys.friendships_scan_again)}
						onPress={handleScanAgain}
						iconLeft={<MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />}
					/>
				</View>
			</View>
		);
	}

	// scanning phase
	if (noCamera || isWeb) {
		// Manual-only input mode
		return (
			<View style={scanStyles.container}>
				<TextInput
					style={[
						scanStyles.manualInput,
						{
							color: theme.screen.text,
							backgroundColor: theme.screen.background,
							borderColor: theme.screen.icon,
						},
					]}
					placeholder={translate(TranslationKeys.friendships_enter_id_placeholder)}
					placeholderTextColor={theme.screen.icon}
					selectionColor={primaryColor}
					value={manualId}
					onChangeText={setManualId}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				<View style={scanStyles.buttonContainer}>
					<ProjectButton
						text={translate(TranslationKeys.friendships_scan_qr)}
						onPress={handleManualSubmit}
						iconLeft={<MaterialCommunityIcons name="account-plus" size={20} color="white" />}
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={scanStyles.container}>
			<View style={scanStyles.cameraSection}>
				{showCamera ? (
					<View style={scanStyles.cameraWrapper}>
						<CameraView
							style={scanStyles.camera}
							facing="back"
							barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
							onBarcodeScanned={handleBarCodeScanned}
						/>
					</View>
				) : canRequestPermission ? (
					<TouchableOpacity style={[scanStyles.permissionButton, { backgroundColor: primaryColor }]} onPress={requestPermission}>
						<MaterialCommunityIcons name="camera" size={24} color="white" />
						<Text style={scanStyles.permissionText}>{translate(TranslationKeys.friendships_allow_camera)}</Text>
					</TouchableOpacity>
				) : null}
			</View>
		</View>
	);
};

/* ───────────────────── QR Generate Modal Content ──────────────────────── */
type QRGenPhase = 'generating' | 'success' | 'error';

type QRGenerateModalContentProps = {
	profileId: string;
	friendshipsHelper: FriendshipsHelper;
	onCreated: (friendship: DatabaseTypes.Friendships) => void;
};

const QRGenerateModalContent: React.FC<QRGenerateModalContentProps> = ({ profileId, friendshipsHelper, onCreated }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const showToast = useToast();
	const [phase, setPhase] = useState<QRGenPhase>('generating');
	const [friendship, setFriendship] = useState<DatabaseTypes.Friendships | null>(null);
	const [errorDetail, setErrorDetail] = useState<string>('');
	const startedRef = useRef(false);

	const generate = useCallback(async () => {
		setPhase('generating');
		setErrorDetail('');
		try {
			const created = await friendshipsHelper.createFriendshipForQR(profileId);
			if (created) {
				setFriendship(created);
				onCreated(created);
				setPhase('success');
			}
		} catch (error: any) {
			const message = error?.message ?? error?.toString?.() ?? JSON.stringify(error);
			setErrorDetail(message);
			setPhase('error');
		}
	}, [friendshipsHelper, profileId, onCreated]);

	React.useEffect(() => {
		if (!startedRef.current) {
			startedRef.current = true;
			generate();
		}
	}, [generate]);

	const handleCopyId = useCallback(async () => {
		if (!friendship?.id) return;
		const copied = await Clipboard.setStringAsync(friendship.id);
		if (copied) {
			showToast(translate(TranslationKeys.copied), 'success');
		}
	}, [friendship?.id, showToast, translate]);

	if (phase === 'generating') {
		return (
			<View style={styles.qrContainer}>
				<ActivityIndicator size="large" color={primaryColor} />
				<Text style={[styles.qrHint, { color: theme.screen.text }]}>
					{translate(TranslationKeys.friendships_generating_qr)}
				</Text>
				<Text style={[styles.qrId, { color: theme.screen.text }]}>
					{translate(TranslationKeys.friendships_generating_qr_hint)}
				</Text>
			</View>
		);
	}

	if (phase === 'error') {
		return (
			<View style={styles.qrContainer}>
				<MaterialCommunityIcons name="alert-circle-outline" size={48} color="#F44336" />
				<Text style={[scanStyles.statusText, { color: theme.screen.text }]}>
					{translate(TranslationKeys.friendships_scan_error_details)}
				</Text>
				<DebugView
					title="Error"
					logs={errorDetail ? [errorDetail] : []}
					isVisible={true}
				/>
				<View style={scanStyles.buttonContainer}>
					<ProjectButton
						text={translate(TranslationKeys.friendships_generate_retry)}
						onPress={generate}
						iconLeft={<MaterialCommunityIcons name="refresh" size={20} color="white" />}
					/>
				</View>
			</View>
		);
	}

	// success
	return (
		<View style={styles.qrContainer}>
			<Text style={[styles.qrHint, { color: theme.screen.text }]}>
				{translate(TranslationKeys.friendships_qr_hint)}
			</Text>
			<View style={styles.qrWrapper}>
				<QRCode
					value={friendship!.id}
					size={200}
					backgroundColor="white"
					color="black"
				/>
			</View>
			<SettingsList
				label="ID"
				value={friendship!.id}
				groupPosition="single"
				leftIcon={<MaterialCommunityIcons name="identifier" size={24} color={theme.screen.icon} />}
				rightIcon={<MaterialCommunityIcons name="content-copy" size={24} color={theme.screen.icon} />}
				handleFunction={handleCopyId}
			/>
		</View>
	);
};

/* ──────────────────────── Main Friendships Screen ─────────────────────── */
const FriendshipsScreen = () => {
	useSetPageTitle(TranslationKeys.friendships);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const showToast = useToast();
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();

	const { profile } = useAppSelector((state) => state.authReducer);
	const { primaryColor, nickNameLocal } = useAppSelector((state) => state.settings);
	const { friendships } = useAppSelector((state) => state.friendships);

	const friendshipsHelper = useMemo(() => new FriendshipsHelper(), []);

	const currentNickname = useMemo(
		() => (profile?.id ? profile?.nickname ?? '' : nickNameLocal ?? ''),
		[nickNameLocal, profile?.id, profile?.nickname]
	);

	const getProfileIdFromField = useCallback((field: string | DatabaseTypes.Profiles | null | undefined): string => {
		if (!field) return '-';
		if (typeof field === 'string') return field;
		return (field as any)?.id ?? '-';
	}, []);

	const pendingFriendships = useMemo(
		() => friendships.filter((f) => f.friendship_status === 'pending'),
		[friendships]
	);

	const acceptedFriendships = useMemo(
		() => friendships.filter((f) => f.friendship_status === 'accepted'),
		[friendships]
	);

	const isAlreadyFriendsWith = useCallback((otherProfileId: string): boolean => {
		return acceptedFriendships.some((f) => {
			const req = getProfileIdFromField(f.requester_profiles_id);
			const rec = getProfileIdFromField(f.receiver_profiles_id);
			return req === otherProfileId || rec === otherProfileId;
		});
	}, [acceptedFriendships, getProfileIdFromField]);

	const handleGenerateQR = useCallback(() => {
		if (!profile?.id) return;
		showScrollViewModal({
			title: translate(TranslationKeys.friendships_generate_qr),
			children: (
				<QRGenerateModalContent
					profileId={profile.id}
					friendshipsHelper={friendshipsHelper}
					onCreated={(created) => {
						dispatch({ type: ADD_FRIENDSHIP, payload: created });
					}}
				/>
			),
		});
	}, [profile?.id, friendshipsHelper, dispatch, showScrollViewModal, translate]);

	const openScanModal = useCallback((noCamera: boolean) => {
		showScrollViewModal({
			title: translate(TranslationKeys.friendships_scan_qr),
			children: (
				<ScanModalContent
					noCamera={noCamera}
					checkAlreadyFriends={async (friendshipId: string) => {
						const existingFriendship = await friendshipsHelper.readFriendship(friendshipId);
						const requesterId = getProfileIdFromField(existingFriendship?.requester_profiles_id);
						return !!(requesterId && requesterId !== '-' && isAlreadyFriendsWith(requesterId));
					}}
					onSubmit={async (friendshipId: string) => {
						if (!profile?.id) return;
						const updated = await friendshipsHelper.updateFriendshipReceiver(friendshipId, profile.id);
						if (updated) {
							const exists = friendships.some((f) => f.id === updated.id);
							dispatch({ type: exists ? UPDATE_FRIENDSHIP : ADD_FRIENDSHIP, payload: updated });
							showToast(translate(TranslationKeys.friendships_confirmed));
							closeScrollViewModal();
						}
					}}
				/>
			),
		});
	}, [profile?.id, friendshipsHelper, friendships, dispatch, showScrollViewModal, closeScrollViewModal, translate, showToast, getProfileIdFromField, isAlreadyFriendsWith]);

	const handleScanQR = useCallback(() => {
		openScanModal(false);
	}, [openScanModal]);

	const handleManualAdd = useCallback(() => {
		openScanModal(true);
	}, [openScanModal]);

	const friendshipStatusColor = (status: string | null | undefined) => {
		switch (status) {
			case 'accepted': return '#4CAF50';
			case 'pending': return '#FFC107';
			case 'rejected': return '#F44336';
			case 'blocked': return '#424242';
			default: return '#9E9E9E';
		}
	};

	const renderFriendshipGroup = (items: DatabaseTypes.Friendships[]) => {
		return items.map((friendship, index) => {
			const isRequester = getProfileIdFromField(friendship.requester_profiles_id) === profile?.id;
			const otherProfileId = isRequester
				? getProfileIdFromField(friendship.receiver_profiles_id)
				: getProfileIdFromField(friendship.requester_profiles_id);
			const statusColor = friendshipStatusColor(friendship.friendship_status);
			const totalItems = items.length;
			const groupPosition = totalItems === 1 ? 'single' : index === 0 ? 'top' : index === totalItems - 1 ? 'bottom' : 'middle';

			return (
				<SettingsList
					key={friendship.id}
					iconBgColor={statusColor}
					leftIcon={<MaterialCommunityIcons name="account-group" size={24} color="white" />}
					label={otherProfileId}
					value={friendship.friendship_status ?? 'unknown'}
					groupPosition={groupPosition}
				/>
			);
		});
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={[styles.contentContainer, { backgroundColor: theme.screen.background }]}
		>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>
					{translate(TranslationKeys.friendships)}
				</Text>

				{/* Profile Info */}
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="identifier" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.friendships_profile_id)}
					value={profile?.id ?? '-'}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="account" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.nickname)}
					value={currentNickname || '-'}
					groupPosition="bottom"
				/>

				{/* Add Friend */}
				<SettingsGroupTitle>{translate(TranslationKeys.friendships_add_friend)}</SettingsGroupTitle>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="qrcode" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.friendships_generate_qr)}
					rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
					handleFunction={handleGenerateQR}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="qrcode-scan" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.friendships_scan_qr)}
					rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
					handleFunction={handleScanQR}
					groupPosition="middle"
				/>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="account-plus" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.friendships_add_manual)}
					rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
					handleFunction={handleManualAdd}
					groupPosition="bottom"
				/>

				{/* Pending Friendships */}
				{pendingFriendships.length > 0 && (
					<>
						<SettingsGroupTitle>{translate(TranslationKeys.friendships_pending)} ({pendingFriendships.length})</SettingsGroupTitle>
						{renderFriendshipGroup(pendingFriendships)}
					</>
				)}

				{/* Accepted Friendships */}
				{acceptedFriendships.length > 0 && (
					<>
						<SettingsGroupTitle>{translate(TranslationKeys.friendships_accepted)} ({acceptedFriendships.length})</SettingsGroupTitle>
						{renderFriendshipGroup(acceptedFriendships)}
					</>
				)}
			</View>
		</ScrollView>
	);
};

export default FriendshipsScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {},
	content: {
		width: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	qrContainer: {
		alignItems: 'center',
		padding: 20,
		gap: 16,
	},
	qrHint: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		marginBottom: 8,
	},
	qrWrapper: {
		padding: 16,
		backgroundColor: 'white',
		borderRadius: 12,
	},
	qrId: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
		opacity: 0.6,
	},
});

const scanStyles = StyleSheet.create({
	container: {
		width: '100%',
		padding: 16,
		gap: 16,
	},
	cameraSection: {
		width: '100%',
		alignItems: 'center',
	},
	cameraWrapper: {
		width: '100%',
		aspectRatio: 1,
		borderRadius: 12,
		overflow: 'hidden',
	},
	camera: {
		flex: 1,
	},
	permissionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 10,
	},
	permissionText: {
		color: 'white',
		fontFamily: 'Poppins_400Regular',
		fontSize: 14,
	},
	statusSection: {
		width: '100%',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 24,
	},
	statusText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		textAlign: 'center',
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'stretch',
	},
	manualInput: {
		width: '100%',
		height: 56,
		borderRadius: 20,
		paddingHorizontal: 20,
		borderWidth: 1,
		fontFamily: 'Poppins_400Regular',
		fontSize: 14,
	},
});
