/**
 * Eating Habits Performance Variant: Plain Full Component with Like State
 *
 * The most complete "plain" variant. Each marking is rendered by its own
 * component that reads its own like/dislike state from Redux, displays the
 * icon/image, translated name, description, and a visual like/dislike
 * indicator – but without the production SettingsListMarkingLabel chrome
 * (no bottom-sheet, no permission modal, no Tooltip).
 *
 * Purpose: isolate the cost of per-item Redux selectors and state compared
 * to the simpler plain-component-with-image variant.
 */
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation, getDescriptionFromTranslation } from '@/helper/resourceHelper';
import { getImageUrl } from '@/constants/HelperFunctions';
import DebugView from '@/components/DebugView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useNavigation } from 'expo-router';

// ---------------------------------------------------------------------------
// Per-marking component – reads its own like state from Redux
// ---------------------------------------------------------------------------
interface PlainFullMarkingRowProps {
	markingId: string;
}

const PlainFullMarkingRow: React.FC<PlainFullMarkingRowProps> = ({ markingId }) => {
	const { theme } = useTheme();
	const language = useAppSelector((state) => state.settings.language);
	const marking = useAppSelector((state) => (state.food.markingsDict as any)?.[String(markingId)]);
	const ownMarking = useAppSelector((state) =>
		state.authReducer.profile?.markings?.find((m: any) => m.markings_id === markingId)
	);

	if (!marking) return null;

	const name = getTextFromTranslation(marking.translations, language) || marking.alias || marking.id;
	const description = getDescriptionFromTranslation(marking.translations, language);
	const imageUri = marking.image_remote_url
		? marking.image_remote_url
		: marking.image
		? getImageUrl(String(marking.image))
		: null;

	const likeColor = ownMarking?.like === true ? '#4CAF50' : theme.screen.text;
	const dislikeColor = ownMarking?.like === false ? '#F44336' : theme.screen.text;

	const isArabic = language === 'ar';

	return (
		<View
			style={{
				flexDirection: isArabic ? 'row-reverse' : 'row',
				marginBottom: 12,
				borderBottomWidth: 1,
				borderBottomColor: theme.screen.text + '22',
				paddingBottom: 8,
				alignItems: 'center',
			}}
		>
			{/* Icon / image */}
			<View
				style={{
					width: 36,
					height: 36,
					marginRight: isArabic ? 0 : 10,
					marginLeft: isArabic ? 10 : 0,
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
					<Text style={{ color: theme.screen.text, fontWeight: 'bold', fontSize: 14 }}>
						{marking.short_code || '?'}
					</Text>
				)}
			</View>

			{/* Text */}
			<View style={{ flex: 1 }}>
				<Text style={{ color: theme.screen.text, fontWeight: 'bold', fontSize: 14, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
					{name}
				</Text>
				{!!description && (
					<Text style={{ color: theme.screen.text, fontSize: 12, marginTop: 2, opacity: 0.7, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
						{description}
					</Text>
				)}
				<Text style={{ color: theme.screen.text, fontSize: 10, marginTop: 2, opacity: 0.4, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
					{`id: ${marking.id}`}
				</Text>
			</View>

			{/* Like / dislike indicator (display only – no dispatch) */}
			<View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8, marginRight: isArabic ? 8 : 0, marginLeft: isArabic ? 0 : 8 }}>
				<TouchableOpacity disabled>
					<MaterialCommunityIcons name="thumb-up-outline" size={20} color={likeColor} />
				</TouchableOpacity>
				<TouchableOpacity disabled>
					<MaterialCommunityIcons name="thumb-down-outline" size={20} color={dislikeColor} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsPlainComponentFull = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_plain_component_full);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);

	const isArabic = language === 'ar';
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_plain_component_full)} />,
		});
	}, [navigation, translate]);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markingsDict]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		`Render time (useMemo): ${renderMs}ms`,
	], [totalMarkingsCount, renderMs, translate]);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title="Plain: Full Component with Like State" logs={debugLogs} isVisible />
				<View>
					{markingIds.map((id: string) => (
						<PlainFullMarkingRow key={id} markingId={id} />
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsPlainComponentFull;
