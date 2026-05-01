import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import SettingsList from '@/components/SettingsList';
import { useNavigation } from 'expo-router';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

// ─── Shimmer hook ────────────────────────────────────────────────────────────
// Animates a stripe that flashes from left to right every few seconds.
function useShimmer(intervalMs = 3500, durationMs = 900) {
	const translateX = useRef(new Animated.Value(-200)).current;

	useEffect(() => {
		let cancelled = false;

		const runOnce = () => {
			translateX.setValue(-200);
			Animated.timing(translateX, {
				toValue: 400,
				duration: durationMs,
				useNativeDriver: true,
			}).start(() => {
				if (!cancelled) {
					setTimeout(runOnce, intervalMs);
				}
			});
		};

		const timer = setTimeout(runOnce, intervalMs * 0.3);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [translateX, intervalMs, durationMs]);

	return translateX;
}

// ─── ShimmerOverlay component ─────────────────────────────────────────────────
const ShimmerOverlay = () => {
	const translateX = useShimmer();
	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.shimmerOverlay,
				{
					transform: [{ translateX }, { skewX: '-20deg' }],
					width: 80,
					height: '100%',
					backgroundColor: 'rgba(255,255,255,0.25)',
				},
			]}
		/>
	);
};

// ─── PulsingBorderWrapper ─────────────────────────────────────────────────────
const PulsingBorderWrapper = ({ children, primaryColor }: { children: React.ReactNode; primaryColor: string }) => {
	const opacity = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, { toValue: 0.25, duration: 900, useNativeDriver: true }),
				Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
			])
		).start();
	}, [opacity]);

	return (
		<View style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
			<Animated.View
				pointerEvents="none"
				style={{
					...StyleSheet.absoluteFillObject,
					borderRadius: 12,
					borderWidth: 2,
					borderColor: primaryColor,
					opacity,
					zIndex: 5,
				}}
			/>
			{children}
		</View>
	);
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const AccountRequiredExample = () => {
	useSetPageTitle(TranslationKeys.account_required_example);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, language } = useAppSelector((state) => state.settings);
	const isLtrLanguage = useIsLtrLanguage();
	const isArabic = !isLtrLanguage;
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.account_required_example)} />,
		});
	}, [navigation, translate]);

	const iconColor = theme.screen.icon;
	const textColor = theme.screen.text;
	const bg = theme.screen.background;
	const textAlign = isArabic ? 'right' : 'left';
	const writingDirection = isArabic ? 'rtl' : 'ltr';

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: bg }]}
			contentContainerStyle={[styles.contentContainer, { backgroundColor: bg }]}
		>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_examples)}</Text>

				{/* ── 1. Default isAccountRequired ─────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_1)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_1)}</Text>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="information-outline" size={24} color={iconColor} />}
					label={translate(TranslationKeys.account_function)}
					isAccountRequired
					groupPosition="single"
					titleTextAlign={isArabic ? 'left' : 'right'}
				/>

				{/* ── 2. Lock icon in the right slot ────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_2)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_2)}</Text>
				<SettingsList
					iconBgColor={primaryColor}
					leftIcon={<MaterialCommunityIcons name="star-outline" size={24} color={iconColor} />}
					label={translate(TranslationKeys.premium_function)}
					rightIcon={<MaterialCommunityIcons name="lock-outline" color="#F5C518" size={22} />}
					handleFunction={() => {}}
					groupPosition="single"
				/>

				{/* ── 3. Gold / Premium border ──────────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_3)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_3)}</Text>
				<View style={styles.goldBorderWrapper}>
					<SettingsList
						iconBgColor="#F5C518"
						leftIcon={<MaterialCommunityIcons name="crown-outline" size={24} color={iconColor} />}
						label={translate(TranslationKeys.premium_function)}
						value={translate(TranslationKeys.account_required)}
						rightIcon={<MaterialCommunityIcons name="lock-outline" color="#F5C518" size={22} />}
						handleFunction={() => {}}
						groupPosition="single"
					/>
				</View>

				{/* ── 4. Dashed border ──────────────────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_4)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_4)}</Text>
				<View style={[styles.dashedBorderWrapper, { borderColor: primaryColor }]}>
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name="lock-outline" size={24} color={iconColor} />}
						label={translate(TranslationKeys.locked_action)}
						value={translate(TranslationKeys.login_required)}
						rightIcon={<Entypo name={isArabic ? "chevron-small-left" : "chevron-small-right"} color={iconColor} size={24} />}
						handleFunction={() => {}}
						groupPosition="single"
					/>
				</View>

				{/* ── 5. Shimmer flash animation ────────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_5)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>
					{translate(TranslationKeys.account_required_description_5)}
				</Text>
				<View style={[styles.shimmerWrapper, { borderWidth: 2, borderColor: primaryColor }]}>
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name="account-lock-outline" size={24} color={iconColor} />}
						label={translate(TranslationKeys.account_function)}
						value={translate(TranslationKeys.unlock_now)}
						rightIcon={<MaterialCommunityIcons name="lock-outline" color={primaryColor} size={22} />}
						handleFunction={() => {}}
						groupPosition="single"
					/>
					<ShimmerOverlay />
				</View>

				{/* ── 6. Lock badge overlay ─────────────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_6)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_6)}</Text>
				<View style={styles.lockBadgeContainer}>
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name="bell-outline" size={24} color={iconColor} />}
						label={translate(TranslationKeys.notifications)}
						rightIcon={<Entypo name={isArabic ? "chevron-small-left" : "chevron-small-right"} color={iconColor} size={24} />}
						handleFunction={() => {}}
						groupPosition="single"
					/>
					<View style={[styles.lockBadge, { backgroundColor: '#F5C518', left: isArabic ? undefined : 0, right: isArabic ? 0 : undefined, top: isArabic ? -10 : undefined }]}>
						<MaterialCommunityIcons name="lock" size={14} color="#fff" />
					</View>
				</View>

				{/* ── 7. Dimmed / disabled overlay ─────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_7)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_7)}</Text>
				<View style={styles.dimContent}>
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name="chart-bar" size={24} color={iconColor} />}
						label={translate(TranslationKeys.statistics)}
						value={translate(TranslationKeys.only_for_registered_users)}
						rightIcon={<Entypo name={isArabic ? "chevron-small-left" : "chevron-small-right"} color={iconColor} size={24} />}
						groupPosition="single"
					/>
					<View style={[styles.dimOverlay, { backgroundColor: 'rgba(128,128,128,0.45)' }]}>
						<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
							<MaterialCommunityIcons name="lock" size={28} color="#fff" />
						</View>
					</View>
				</View>

				{/* ── 8. Custom dark button with shimmer ───────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_8)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_8)}</Text>
				<View style={[styles.shimmerWrapper, { borderWidth: 2, borderColor: '#F5C518' }]}>
					<TouchableOpacity
						activeOpacity={0.8}
						onPress={() => {}}
						style={{
							backgroundColor: '#1a1a2e',
							borderRadius: 12,
							flexDirection: isArabic ? 'row-reverse' : 'row',
							alignItems: 'center',
							padding: 14,
							gap: 12,
						}}
					>
						<View
							style={{
								width: 40,
								height: 40,
								borderRadius: 10,
								backgroundColor: '#F5C518',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<MaterialCommunityIcons name="crown" size={22} color="#1a1a2e" />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={{ color: '#F5C518', fontFamily: 'Poppins_700Bold', fontSize: 15, textAlign, writingDirection }}>{translate(TranslationKeys.unlock_premium)}</Text>
							<Text style={{ color: '#aaa', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign, writingDirection }}>{translate(TranslationKeys.account_required)}</Text>
						</View>
						<MaterialCommunityIcons name={isArabic ? "chevron-left" : "chevron-right"} size={22} color="#F5C518" />
					</TouchableOpacity>
					<ShimmerOverlay />
				</View>

				{/* ── 9. Pulsing border animation ───────────────────────────────── */}
				<Text style={[styles.sectionTitle, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_example_9)}</Text>
				<Text style={[styles.sectionDescription, { color: textColor, textAlign, writingDirection }]}>{translate(TranslationKeys.account_required_description_9)}</Text>
				<PulsingBorderWrapper primaryColor={primaryColor}>
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name="account-circle-outline" size={24} color={iconColor} />}
						label={translate(TranslationKeys.profile_settings)}
						value={translate(TranslationKeys.account_required)}
						rightIcon={<MaterialCommunityIcons name="lock-outline" color={primaryColor} size={22} />}
						handleFunction={() => {}}
						groupPosition="single"
					/>
				</PulsingBorderWrapper>
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
		rowGap: 12,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: 'Poppins_600SemiBold',
		marginTop: 16,
	},
	sectionDescription: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
		marginBottom: 4,
		opacity: 0.7,
	},
	goldBorderWrapper: {
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#F5C518',
		overflow: 'hidden',
	},
	shimmerWrapper: {
		borderRadius: 12,
		overflow: 'hidden',
	},
	shimmerOverlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 10,
	},
	lockBadgeContainer: {
		position: 'relative',
	},
	lockBadge: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 20,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.3,
		shadowRadius: 2,
	},
	dashedBorderWrapper: {
		borderRadius: 12,
		borderWidth: 2,
		borderStyle: 'dashed',
		overflow: 'hidden',
	},
	dimOverlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 12,
		zIndex: 10,
	},
	dimContent: {
		position: 'relative',
	},
});

export default AccountRequiredExample;

