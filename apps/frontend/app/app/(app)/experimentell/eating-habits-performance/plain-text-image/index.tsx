/**
 * Eating Habits Performance Variant: Plain Text + Image
 *
 * Extends the plain-text variant by adding each marking's icon/image.
 * Renders a plain <Image> (or a short-code <Text> fallback) next to the
 * translated name and description.
 *
 * Purpose: measure the additional render cost of loading marking images.
 */
import { Image, SafeAreaView, ScrollView, Text, View } from 'react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation, getDescriptionFromTranslation } from '@/helper/resourceHelper';
import { getImageUrl } from '@/constants/HelperFunctions';
import DebugView from '@/components/DebugView';
import { useNavigation } from 'expo-router';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';

const EatingHabitsPlainTextImage = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_plain_text_image);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);
	const isArabic = language === 'ar';
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_plain_text_image)} />,
		});
	}, [navigation, translate]);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markingsDict]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		`Render time (useMemo): ${renderMs}ms`,
	], [totalMarkingsCount, renderMs, translate]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title="Plain: Text, Translation & Image" logs={debugLogs} isVisible />
				<View>
					{(markings ?? []).map((marking: DatabaseTypes.Markings) => {
						const name = getTextFromTranslation(marking.translations, language);
						const description = getDescriptionFromTranslation(marking.translations, language);
						const imageUri = marking.image_remote_url
							? marking.image_remote_url
							: marking.image
							? getImageUrl(String(marking.image))
							: null;

						return (
							<View
								key={marking.id}
								style={{
									flexDirection: isArabic ? 'row-reverse' : 'row',
									marginBottom: 12,
									borderBottomWidth: 1,
									borderBottomColor: theme.screen.text + '22',
									paddingBottom: 8,
									alignItems: 'center',
								}}
							>
								{/* Image / short-code fallback */}
								<View
									style={{
										width: 36,
										height: 36,
										...(isArabic ? { marginLeft: 10 } : { marginRight: 10 }),
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: marking.background_color || 'transparent',
										borderRadius: 8,
									}}
								>
									{imageUri ? (
										<Image
											source={{ uri: imageUri }}
											style={{ width: 32, height: 32, resizeMode: 'contain' }}
										/>
									) : (
										<Text
											style={{
												color: theme.screen.text,
												fontWeight: 'bold',
												fontSize: 14,
											}}
										>
											{marking.short_code || '?'}
										</Text>
									)}
								</View>

								{/* Text */}
								<View style={{ flex: 1, ...(isArabic ? { alignItems: 'flex-end' } : {}) }}>
									<Text
										style={{
											color: theme.screen.text,
											fontWeight: 'bold',
											fontSize: 14,
											...(isArabic ? { textAlign: 'right', writingDirection: 'rtl' } : {}),
										}}
									>
										{name || marking.alias || marking.id}
									</Text>
									{!!description && (
										<Text
											style={{
												color: theme.screen.text,
												fontSize: 12,
												marginTop: 2,
												opacity: 0.7,
												...(isArabic ? { textAlign: 'right', writingDirection: 'rtl' } : {}),
											}}
										>
											{description}
										</Text>
									)}
									<Text
										style={{
											color: theme.screen.text,
											fontSize: 10,
											marginTop: 2,
											opacity: 0.4,
											...(isArabic ? { textAlign: 'right', writingDirection: 'ltr' } : {}),
										}}
									>
										{`id: ${marking.id}`}
									</Text>
								</View>
							</View>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsPlainTextImage;
