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
import { CameraView, useCameraPermissions } from 'expo-camera';

const isWeb = Platform.OS === 'web';

type ScanModalContentProps = {
	onSubmit: (id: string) => Promise<void>;
	submitLabel: string;
	placeholder: string;
};

const ScanModalContent: React.FC<ScanModalContentProps> = ({ onSubmit, submitLabel, placeholder }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const [value, setValue] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const scannedRef = useRef(false);
	const [permission, requestPermission] = useCameraPermissions();

	const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
		if (scannedRef.current) return;
		scannedRef.current = true;
		setValue(data);
		setTimeout(() => { scannedRef.current = false; }, 2000);
	}, []);

	const handleSubmit = useCallback(async () => {
		if (!value.trim()) return;
		setSubmitting(true);
		try {
			await onSubmit(value.trim());
		} finally {
			setSubmitting(false);
		}
	}, [value, onSubmit]);

	const showCamera = !isWeb && permission?.granted;
	const canRequestPermission = !isWeb && permission && !permission.granted;

	return (
		<View style={scanStyles.container}>
			{!isWeb && (
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
			)}

			<TextInput
				style={[
					scanStyles.input,
					{
						color: theme.screen.text,
						backgroundColor: theme.screen.background,
						borderColor: theme.screen.icon,
					},
				]}
				placeholder={placeholder}
				placeholderTextColor={theme.screen.icon}
				selectionColor={primaryColor}
				value={value}
				onChangeText={setValue}
				autoCapitalize="none"
				autoCorrect={false}
			/>

			<View style={scanStyles.buttonContainer}>
				<ProjectButton
					text={submitting ? '...' : submitLabel}
					onPress={handleSubmit}
				/>
			</View>
		</View>
	);
};

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

	const [generatingQR, setGeneratingQR] = useState(false);

	const handleGenerateQR = useCallback(async () => {
		if (!profile?.id) return;
		setGeneratingQR(true);
		try {
			const friendship = await friendshipsHelper.createFriendshipForQR(profile.id);
			if (friendship) {
				dispatch({ type: ADD_FRIENDSHIP, payload: friendship });
				showScrollViewModal({
					title: translate(TranslationKeys.friendships_generate_qr),
					children: (
						<View style={styles.qrContainer}>
							<Text style={[styles.qrHint, { color: theme.screen.text }]}>
								{translate(TranslationKeys.friendships_qr_hint)}
							</Text>
							<View style={styles.qrWrapper}>
								<QRCode
									value={friendship.id}
									size={200}
									backgroundColor="white"
									color="black"
								/>
							</View>
							<Text style={[styles.qrId, { color: theme.screen.text }]}>
								ID: {friendship.id}
							</Text>
						</View>
					),
				});
			}
		} catch (error) {
			console.error('Error generating QR code:', error);
		} finally {
			setGeneratingQR(false);
		}
	}, [profile?.id, friendshipsHelper, dispatch, showScrollViewModal, translate, theme.screen.text]);

	const handleScanQR = useCallback(() => {
		showScrollViewModal({
			title: translate(TranslationKeys.friendships_scan_qr),
			children: (
				<ScanModalContent
					placeholder={translate(TranslationKeys.friendships_enter_id_placeholder)}
					submitLabel={translate(TranslationKeys.friendships_scan_qr)}
					onSubmit={async (friendshipId: string) => {
						if (!profile?.id) return;
						try {
							const updated = await friendshipsHelper.updateFriendshipReceiver(friendshipId, profile.id);
							if (updated) {
								const exists = friendships.some((f) => f.id === updated.id);
								dispatch({ type: exists ? UPDATE_FRIENDSHIP : ADD_FRIENDSHIP, payload: updated });
								showToast(translate(TranslationKeys.friendships_request_sent));
								closeScrollViewModal();
							}
						} catch (error) {
							console.error('Error accepting friendship:', error);
							showToast(translate(TranslationKeys.friendships_request_error), 'error');
						}
					}}
				/>
			),
		});
	}, [profile?.id, friendshipsHelper, friendships, dispatch, showScrollViewModal, closeScrollViewModal, translate, showToast]);

	const getProfileIdFromField = (field: string | DatabaseTypes.Profiles | null | undefined): string => {
		if (!field) return '-';
		if (typeof field === 'string') return field;
		return (field as any)?.id ?? '-';
	};

	const friendshipStatusColor = (status: string | null | undefined) => {
		switch (status) {
			case 'accepted': return '#4CAF50';
			case 'pending': return '#FFC107';
			case 'rejected': return '#F44336';
			case 'blocked': return '#424242';
			default: return '#9E9E9E';
		}
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
					rightIcon={generatingQR ? <ActivityIndicator size="small" /> : <Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
					handleFunction={handleGenerateQR}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="qrcode-scan" size={24} color={theme.screen.icon} />}
					label={translate(TranslationKeys.friendships_scan_qr)}
					rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
					handleFunction={handleScanQR}
					groupPosition="bottom"
				/>

				{/* Friendships List */}
				{friendships.length > 0 && (
					<>
						<SettingsGroupTitle>{translate(TranslationKeys.friendships)} ({friendships.length})</SettingsGroupTitle>
						{friendships.map((friendship, index) => {
							const isRequester = getProfileIdFromField(friendship.requester_profiles_id) === profile?.id;
							const otherProfileId = isRequester
								? getProfileIdFromField(friendship.receiver_profiles_id)
								: getProfileIdFromField(friendship.requester_profiles_id);
							const statusColor = friendshipStatusColor(friendship.friendship_status);
							const totalItems = friendships.length;
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
						})}
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
	input: {
		width: '100%',
		height: 56,
		borderRadius: 20,
		paddingHorizontal: 20,
		borderWidth: 1,
		fontFamily: 'Poppins_400Regular',
		fontSize: 14,
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'stretch',
	},
});
