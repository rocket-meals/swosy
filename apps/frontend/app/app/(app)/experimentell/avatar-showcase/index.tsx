import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import SettingsList from '@/components/SettingsList';
import { MyAvatar, AvatarStyle } from 'repo-depkit-common-ui';

/** All available avatar styles as a typed array for iteration. */
const ALL_AVATAR_STYLES: AvatarStyle[] = Object.values(AvatarStyle);

/** Predefined seed examples. */
const SEED_OPTIONS = ['John Doe', 'Jane Smith', 'Alice', 'Bob', 'Charlie', 'Rocket Meals'];

type GroupPosition = 'top' | 'middle' | 'bottom' | 'single';

function getGroupPosition(index: number, totalItems: number): GroupPosition {
	if (totalItems === 1) return 'single';
	if (index === 0) return 'top';
	if (index === totalItems - 1) return 'bottom';
	return 'middle';
}

const AvatarShowcase = () => {
	useSetPageTitle(TranslationKeys.avatar_showcase);
	const { theme } = useTheme();
	const { primaryColor } = useAppSelector((state) => state.settings);

	const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(AvatarStyle.Lorelei);
	const [selectedSeed, setSelectedSeed] = useState<string>('John Doe');
	const [avatarSize, setAvatarSize] = useState<number>(128);

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={[styles.contentContainer, { backgroundColor: theme.screen.background }]}
		>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>Avatar Showcase</Text>

				{/* Avatar Preview */}
				<View style={styles.previewContainer}>
					<MyAvatar seed={selectedSeed} style={selectedStyle} size={avatarSize} />
					<Text style={[styles.previewLabel, { color: theme.screen.text }]}>
						{selectedStyle} — "{selectedSeed}"
					</Text>
				</View>

				{/* Size Buttons */}
				<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>Size</Text>
				<View style={styles.buttonRow}>
					{[64, 96, 128, 192].map((size) => (
						<TouchableOpacity
							key={size}
							style={[
								styles.sizeButton,
								{
									backgroundColor: avatarSize === size ? primaryColor : theme.screen.surface,
									borderColor: primaryColor,
								},
							]}
							onPress={() => setAvatarSize(size)}
						>
							<Text style={{ color: avatarSize === size ? '#fff' : theme.screen.text, fontWeight: '600' }}>
								{size}px
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Seed Selection */}
				<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>Seed</Text>
				{SEED_OPTIONS.map((seed, index) => {
					const groupPosition = getGroupPosition(index, SEED_OPTIONS.length);

					return (
						<SettingsList
							key={seed}
							iconBgColor={selectedSeed === seed ? primaryColor : theme.screen.surface}
							leftIcon={
								<MaterialCommunityIcons
									name={selectedSeed === seed ? 'account-check' : 'account-outline'}
									size={24}
									color={selectedSeed === seed ? '#fff' : theme.screen.icon}
								/>
							}
							label={seed}
							handleFunction={() => setSelectedSeed(seed)}
							groupPosition={groupPosition}
						/>
					);
				})}

				{/* Style Selection */}
				<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>Style</Text>
				{ALL_AVATAR_STYLES.map((avatarStyle, index) => {
					const groupPosition = getGroupPosition(index, ALL_AVATAR_STYLES.length);

					return (
						<SettingsList
							key={avatarStyle}
							iconBgColor={selectedStyle === avatarStyle ? primaryColor : theme.screen.surface}
							leftIconComponent={
								<View style={styles.stylePreview}>
									<MyAvatar seed={selectedSeed} style={avatarStyle} size={32} />
								</View>
							}
							label={avatarStyle}
							handleFunction={() => setSelectedStyle(avatarStyle)}
							groupPosition={groupPosition}
						/>
					);
				})}
			</View>
		</ScrollView>
	);
};

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
	sectionTitle: {
		fontSize: 18,
		fontFamily: 'Poppins_700Bold',
		marginTop: 20,
		marginBottom: 8,
	},
	previewContainer: {
		alignItems: 'center',
		paddingVertical: 24,
	},
	previewLabel: {
		marginTop: 12,
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		flexWrap: 'wrap',
		marginBottom: 8,
	},
	sizeButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	stylePreview: {
		width: 32,
		height: 32,
		borderRadius: 16,
		overflow: 'hidden',
	},
});

export default AvatarShowcase;
