import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListAvatar, useTheme } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import { router, useNavigation } from 'expo-router';
import { addFriend } from '../../store/friendsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { PLAYER_COLORS } from '../../helpers/GameStorage';
import { ComponentIds } from '../../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const FRIEND_AVATAR_SIZE = 60; // 50% larger than the original 40

export default function PlayersScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const friends = useSelector((state: RootState) => state.friends.friends);
	const navigation = useNavigation();

	const handleAddFriend = useCallback(() => {
		const friendNumber = friends.length + 1;
		const color = PLAYER_COLORS[friends.length % PLAYER_COLORS.length];
		const action = dispatch(addFriend(`Freund ${friendNumber}`, color));
		const newFriendId = action.payload.id;
		router.push({ pathname: '/players/[id]', params: { id: newFriendId } });
	}, [friends.length, dispatch]);

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					nativeID={ComponentIds.PLAYERS_SCREEN_ADD_BUTTON}
					onPress={handleAddFriend}
					style={styles.headerButton}
				>
					<Ionicons name="person-add-outline" size={22} color={theme.header.text} />
				</TouchableOpacity>
			),
		});
	}, [navigation, theme.header.text, handleAddFriend]);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView
				contentContainerStyle={[
					styles.listContent,
					{ paddingBottom: insets.bottom + 32, paddingLeft: insets.left, paddingRight: insets.right },
				]}
			>
				{friends.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Ionicons name="people-outline" size={64} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.text }]}>Noch keine Freunde</Text>
						<Text style={[styles.emptySubtext, { color: theme.screen.placeholder }]}>
							Füge einen Freund über den + Button im Header hinzu
						</Text>
					</View>
				) : (
					friends.map((friend, index) => (
						<SettingsListAvatar
							key={friend.id}
							nativeID={`${ComponentIds.PLAYERS_SCREEN_FRIEND_ROW_PREFIX}${friend.id}`}
							config={friend.avatarConfig}
							avatarBackgroundColor={friend.color}
							previewSize={FRIEND_AVATAR_SIZE}
							label={friend.name}
							rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
							onPressOverride={() => router.push({ pathname: '/players/[id]', params: { id: friend.id } })}
							groupPosition={index === 0 ? 'top' : index === friends.length - 1 ? 'bottom' : 'middle'}
						/>
					))
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerButton: {
		padding: 4,
		marginRight: 8,
	},
	listContent: {
		padding: 12,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 96,
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
	},
});
