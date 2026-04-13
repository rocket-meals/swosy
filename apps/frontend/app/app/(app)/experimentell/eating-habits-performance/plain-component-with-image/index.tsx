/**
 * Eating Habits Performance Variant: Plain Component with Image & Text
 *
 * Extends plain-each-component by adding the marking's icon/image inside
 * each individual component. Still no Redux or hooks inside the item
 * component – all data is resolved in the parent and passed as props.
 *
 * Purpose: measure the additional render cost of images inside individual
 * components compared to plain-each-component (text only).
 */
import { Image, SafeAreaView, ScrollView, Text, View } from 'react-native';
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
import { PlainMarkingBaseProps } from '..';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useNavigation } from 'expo-router';

// ---------------------------------------------------------------------------
// Plain component with image – receives resolved strings + image URI as props
// ---------------------------------------------------------------------------
interface PlainMarkingImageRowProps extends PlainMarkingBaseProps {
	imageUri: string | null;
	shortCode: string | null;
	bgColor: string | null;
	isArabic: boolean;
}

const PlainMarkingImageRow: React.FC<PlainMarkingImageRowProps> = ({
	id,
	name,
	description,
	imageUri,
	shortCode,
	bgColor,
	borderColor,
	textColor,
	isArabic,
}) => (
	<View
		style={{
			flexDirection: isArabic ? 'row-reverse' : 'row',
			marginBottom: 12,
			borderBottomWidth: 1,
			borderBottomColor: borderColor,
			paddingBottom: 8,
			alignItems: 'center',
		}}
	>
		{/* Image / short-code badge */}
		<View
			style={{
				width: 36,
				height: 36,
				marginRight: isArabic ? 0 : 10,
				marginLeft: isArabic ? 10 : 0,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: bgColor || 'transparent',
				borderRadius: 8,
			}}
		>
			{imageUri ? (
				<Image
					source={{ uri: imageUri }}
					style={{ width: 32, height: 32, resizeMode: 'contain' }}
				/>
			) : (
				<Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>
					{shortCode || '?'}
				</Text>
			)}
		</View>

		{/* Text */}
		<View style={{ flex: 1 }}>
			<Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
				{name}
			</Text>
			{!!description && (
				<Text style={{ color: textColor, fontSize: 12, marginTop: 2, opacity: 0.7, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
					{description}
				</Text>
			)}
			<Text style={{ color: textColor, fontSize: 10, marginTop: 2, opacity: 0.4, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>
				{`id: ${id}`}
			</Text>
		</View>
	</View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsPlainComponentWithImage = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_plain_component_with_image);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);

	const isArabic = language === 'ar';
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_plain_component_with_image)} />,
		});
	}, [navigation, translate]);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markingsDict]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		`Render time (useMemo): ${renderMs}ms`,
	], [totalMarkingsCount, renderMs, translate]);

	const borderColor = theme.screen.text + '22';
	const textColor = theme.screen.text;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title="Plain: Component with Image & Text" logs={debugLogs} isVisible />
				<View>
					{(markings ?? []).map((marking: DatabaseTypes.Markings) => {
						const name = getTextFromTranslation(marking.translations, language) || marking.alias || marking.id;
						const description = getDescriptionFromTranslation(marking.translations, language);
						const imageUri = marking.image_remote_url
							? marking.image_remote_url
							: marking.image
							? getImageUrl(String(marking.image))
							: null;

						return (
							<PlainMarkingImageRow
								key={marking.id}
								id={marking.id}
								name={name}
								description={description}
								imageUri={imageUri}
								shortCode={marking.short_code || null}
								bgColor={marking.background_color || null}
								borderColor={borderColor}
								textColor={textColor}
								isArabic={isArabic}
							/>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsPlainComponentWithImage;
