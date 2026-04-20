import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ADD_FRIENDSHIP, SET_FRIENDSHIPS, UPDATE_FRIENDSHIP } from '@/redux/Types/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import useMyScrollviewTextInputModal from '@/hooks/useMyScrollviewTextInputModal';
import useToast from '@/hooks/useToast';

const FriendshipsScreen = () => {
	useSetPageTitle(TranslationKeys.friendships);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const showToast = useToast();
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { openTextInputModal } = useMyScrollviewTextInputModal();

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
		openTextInputModal({
			title: translate(TranslationKeys.friendships_scan_enter_id),
			placeholder: translate(TranslationKeys.friendships_enter_id_placeholder),
			initialValue: '',
			saveLabel: translate(TranslationKeys.friendships_scan_qr),
			onSave: async (friendshipId: string) => {
				if (!profile?.id || !friendshipId.trim()) return;
				try {
					const updated = await friendshipsHelper.updateFriendshipRequester(friendshipId.trim(), profile.id);
					if (updated) {
						const exists = friendships.some((f) => f.id === updated.id);
						dispatch({ type: exists ? UPDATE_FRIENDSHIP : ADD_FRIENDSHIP, payload: updated });
						showToast(translate(TranslationKeys.friendships_request_sent));
					}
				} catch (error) {
					console.error('Error scanning QR code:', error);
					showToast(translate(TranslationKeys.friendships_request_error), 'error');
				}
			},
			checkTextInput: (value: string) => ({
				isValid: value.trim().length > 0,
				value: value.trim(),
			}),
		});
	}, [profile?.id, friendshipsHelper, friendships, dispatch, openTextInputModal, translate, showToast]);

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
							const isReceiver = getProfileIdFromField(friendship.receiver_profiles_id) === profile?.id;
							const otherProfileId = isReceiver
								? getProfileIdFromField(friendship.requester_profiles_id)
								: getProfileIdFromField(friendship.receiver_profiles_id);
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
