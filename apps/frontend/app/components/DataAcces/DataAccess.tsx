import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, Text, View } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { useAppSelector } from '@/redux/hooks';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsList from '@/components/SettingsList';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';

const parseMarkdown = (text: string, theme: any, isRtl: boolean) => {
	return text.split('\n').map((line, index) => {
		if (line.startsWith('## ')) {
			return (
				<Text
					key={index}
					style={[
						styles.value,
						{ color: theme.header.text, textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
					]}
				>
					{line.replace('## ', '')}
				</Text>
			);
		} else if (line.startsWith('### ')) {
			return (
				<Text
					key={index}
					style={[
						styles.labelParagraph,
						{ color: theme.header.text, textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
					]}
				>
					{line.replace('### ', '')}
				</Text>
			);
		} else {
			return (
				<Text
					key={index}
					style={[
						styles.titleHeading,
						{ color: theme.header.text, textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
					]}
				>
					{line}
				</Text>
			);
		}
	});
};

const DataAccess = ({ onOpenBottomSheet }: any) => {
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const isRtl = language === 'ar';
	const { user, profile } = useAppSelector(state => state.authReducer);
	const { primaryColor } = useAppSelector(state => state.settings);
	const { collectibleEventsItemsDict } = useAppSelector(state => state.collectibleEvents ?? {});
	const collectibleEvents = useMemo(() => Object.values(collectibleEventsItemsDict || {}), [collectibleEventsItemsDict]);
	const {
		canteensDict,
		buildingsDict,
		buildingsOrganizationsDict,
		organisationsDict,
		selectedCanteenFoodOffersDict,
		canteenFoodOffersDict,
		businessHoursDict,
		businessHoursGroupsDict,
		canteenFeedbackLabelsDict,
		ownCanteenFeedBackLabelEntriesDict,
	} = useAppSelector(state => state.canteenReducer);

	const {
		foodFeedbackLabelsDict,
		ownFoodFeedbacksDict,
		ownfoodFeedbackLabelEntriesDict,
		markingsDict,
		markingGroupsDict,
		selectedFoodMarkingsDict,
		foodCategoriesDict,
		foodOfferCategoriesDict,
		foodOffersInfoItemsDict,
		mostLikedFoodsDict,
		mostDislikedFoodsDict,
		popupEventsDict,
		markingDetails,
	} = useAppSelector(state => state.food);
	const ownFoodFeedbacks = useMemo(() => Object.values(ownFoodFeedbacksDict || {}), [ownFoodFeedbacksDict]);

	const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

	useEffect(() => {
		const onChange = ({ window }: { window: any }) => {
			setWindowWidth(window.width);
		};

		const subscription = Dimensions.addEventListener('change', onChange);
		return () => {
			subscription.remove();
		};
	}, []);

	const dataAccessText = translate(TranslationKeys.data_access_introduction);

	const infoItems = [
		{ label: 'account', value: user },
		{ label: 'profile', value: profile },
		{ label: 'food_feedbacks', value: ownFoodFeedbacks },
	];

	const dataDevice = [
		{ label: 'canteensDict', value: canteensDict },
		{ label: 'buildingsDict', value: buildingsDict },
		{ label: 'buildingsOrganizationsDict', value: buildingsOrganizationsDict },
		{ label: 'organisationsDict', value: organisationsDict },
		{ label: 'selectedCanteenFoodOffersDict', value: selectedCanteenFoodOffersDict },
		{ label: 'canteenFoodOffersDict', value: canteenFoodOffersDict },
		{ label: 'businessHoursDict', value: businessHoursDict },
		{ label: 'businessHoursGroupsDict', value: businessHoursGroupsDict },
		{ label: 'canteenFeedbackLabelsDict', value: canteenFeedbackLabelsDict },
		{
			label: 'Own Canteen FeedBack Label Entries',
			value: ownCanteenFeedBackLabelEntriesDict,
		},
		{ label: 'foodFeedbackLabelsDict', value: foodFeedbackLabelsDict },
		{ label: 'ownFoodFeedbacksDict', value: ownFoodFeedbacksDict },
		{ label: 'ownfoodFeedbackLabelEntriesDict', value: ownfoodFeedbackLabelEntriesDict },
		{ label: 'markingsDict', value: markingsDict },
		{ label: 'markingGroupsDict', value: markingGroupsDict },
		{ label: 'selectedFoodMarkingsDict', value: selectedFoodMarkingsDict },
		{ label: 'foodCategoriesDict', value: foodCategoriesDict },
		{ label: 'foodOfferCategoriesDict', value: foodOfferCategoriesDict },
		{ label: 'foodOffersInfoItemsDict', value: foodOffersInfoItemsDict },
		{ label: 'mostLikedFoodsDict', value: mostLikedFoodsDict },
		{ label: 'mostDislikedFoodsDict', value: mostDislikedFoodsDict },
		{ label: 'popupEventsDict', value: popupEventsDict },
		{ label: 'markingDetails', value: markingDetails },
		{ label: 'collectibleEvents', value: collectibleEvents },
        ];

	return (
		<View style={{ ...styles.container, backgroundColor: theme.screen.background }}>
			<ScrollView
				contentContainerStyle={{
					...styles.contentContainer,
					backgroundColor: theme.screen.background,
				}}
			>
				<View style={{ alignItems: 'center' }}>
					<View style={styles.imageContainer}>
						<Image source={require('../../assets/images/dataAccess.png')} style={styles.image} />
					</View>
					<View style={{ width: '100%' }}>{parseMarkdown(dataAccessText, theme, isRtl)}</View>
				</View>
				<SettingsGroupTitle>{translate(TranslationKeys.your_data_which_we_know_if_you_have_a_profile)}</SettingsGroupTitle>
				{/* Info Items List */}
				<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_data_access} />
				<View
					style={{
						width: windowWidth < 500 ? '100%' : isWeb ? '80%' : '100%',
					}}
				>
					{infoItems.map((item, index) => {
						const last = index === infoItems.length - 1;
						const first = index === 0;
						const groupPosition = infoItems.length === 1 ? 'single' : first ? 'top' : last ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={index}
								iconBgColor={primaryColor}
								leftIcon={<MaterialCommunityIcons name="database-eye" size={24} color={theme.screen.icon} />}
								label={item.label}
								rightIcon={<Entypo name={isRtl ? 'chevron-small-left' : 'chevron-small-right'} size={24} color={theme.screen.icon} />}
								handleFunction={() => onOpenBottomSheet(item)}
								groupPosition={groupPosition as any}
							/>
						);
					})}

					{/* Device Data List */}
					<SettingsGroupTitle>{translate(TranslationKeys.translation_all_on_device_saved_data)}</SettingsGroupTitle>
					{dataDevice.map((data, index) => {
						if (!data?.value) return null;
						const last = index === dataDevice.length - 1;
						const first = index === 0;
						const groupPosition = dataDevice.length === 1 ? 'single' : first ? 'top' : last ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={index}
								iconBgColor={primaryColor}
								leftIcon={<MaterialCommunityIcons name="database-eye" size={24} color={theme.screen.icon} />}
								label={data.label}
								rightIcon={<Entypo name={isRtl ? 'chevron-small-left' : 'chevron-small-right'} size={24} color={theme.screen.icon} />}
								handleFunction={() => onOpenBottomSheet(data)}
								groupPosition={groupPosition as any}
							/>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
};

export default DataAccess;
