import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import styles from './styles';
import FoodLabelingInfo from '../FoodLabelingInfo';
import DebugView from '@/components/DebugView';
import MarkingLabels from '../MarkingLabels/MarkingLabels';
import { getFoodOffer } from '@/constants/HelperFunctions';
import { CollectibleAt, DatabaseTypes, sortMarkingsByGroup } from 'repo-depkit-common';
import { createSelector } from 'reselect';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { MarkingGroupsHelper } from '@/redux/actions/MarkingGroups/MarkingGroups';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { fetchFoodofferComponentsById } from '@/redux/actions/FoodOffers/FoodOffers';
import AttributeItem from '@/components/Details/AttributeItem';

interface LabelsProps {
	foodDetails: any;
	offerId?: string;
	foodOfferDetails?: DatabaseTypes.Foodoffers | null;
	handleMenuSheet?: () => void;
	color: string;
}

const selectMarkings = (state: RootState) => state.food.markings;

export const selectFoodOffer = (offerId?: string) =>
	createSelector([(state: RootState) => state.canteenReducer.selectedCanteenFoodOffers], foodOffers =>
		offerId ? getFoodOffer(foodOffers, offerId) : undefined
	);

const Labels: React.FC<LabelsProps> = ({ foodDetails, offerId, foodOfferDetails, handleMenuSheet, color }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor, appSettings } = useSelector((state: RootState) => state.settings);
	const { isDevMode } = useSelector((state: RootState) => state.authReducer);
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;

	let food_responsible_organization_name = appSettings?.food_responsible_organization_name || 'Verantwortliche Organisation';
	let food_responsible_organization_link = appSettings?.food_responsible_organization_link || 'https://www.studentenwerk-osnabrueck.de/';
	const handleRedirect = () => {
		Linking.openURL(food_responsible_organization_link).catch(err => console.error('Failed to open URL:', err));
	};

	const markings = useSelector(selectMarkings);
	const foodOfferSelector = useMemo(
		() => (offerId ? selectFoodOffer(offerId) : () => undefined),
		[offerId]
	);
	const foodOffer = useSelector(foodOfferSelector as (state: RootState) => DatabaseTypes.Foodoffers | undefined);

	// State for marking groups
	const [markingGroups, setMarkingGroups] = useState<DatabaseTypes.MarkingsGroups[]>([]);

	// State for foodoffer components
	const [foodofferComponents, setFoodofferComponents] = useState<any[]>([]);
	const [componentsLoading, setComponentsLoading] = useState(false);

	// Fetch marking groups
	useEffect(() => {
		const fetchMarkingGroups = async () => {
			try {
				const markingGroupsHelper = new MarkingGroupsHelper();
				const result = await markingGroupsHelper.fetchMarkingGroups({});
				if (result) {
					setMarkingGroups(result);
				}
			} catch (error) {
				console.error('Error fetching marking groups:', error);
			}
		};

		fetchMarkingGroups();
	}, []);

	// Fetch foodoffer components when offerId is available
	useEffect(() => {
		if (!offerId) return;
		const fetchComponents = async () => {
			setComponentsLoading(true);
			try {
				const result = await fetchFoodofferComponentsById(offerId);
				const components = result?.data?.foodoffer_components;
				if (components) {
					setFoodofferComponents(components);
				}
			} catch (error) {
				console.error('Error fetching foodoffer components:', error);
			} finally {
				setComponentsLoading(false);
			}
		};
		fetchComponents();
	}, [offerId]);

	const mappedFoodOfferMarkings = useMemo(() => {
		const offerMarkings = foodOfferDetails?.markings ?? foodOffer?.markings;
		if (!offerMarkings) return [];

		return offerMarkings
			?.map((marking: DatabaseTypes.FoodoffersMarkings) => markings.find((mark: DatabaseTypes.Markings) => mark.id === marking?.markings_id))
			.filter((mark: any): mark is DatabaseTypes.Markings => Boolean(mark));
	}, [foodOffer, foodOfferDetails, markings]);

	const foodMarkings = useMemo(() => {
		return sortMarkingsByGroup(mappedFoodOfferMarkings, markingGroups);
	}, [mappedFoodOfferMarkings, markingGroups]);

	const componentItems = useMemo(() => {
		return foodofferComponents
			?.map(junction => junction?.component_foodoffers_id)
			?.filter((c: any) => !!c?.alias) ?? [];
	}, [foodofferComponents]);

	return (
		<View style={styles.container}>
			<Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.markings)}</Text>
			<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers_details_markings} />
			{foodMarkings?.map((marking: DatabaseTypes.Markings) => (
				<MarkingLabels key={marking.id} markingId={marking.id} handleMenuSheet={handleMenuSheet} />
			))}

			{offerId && (
				<View>
					<Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.foodoffer_components_label)}</Text>
					{componentsLoading ? (
						<ActivityIndicator size={30} color={theme.screen.text} />
					) : (
						componentItems.length > 0 && (
							<View style={styles.attributeList}>
								{componentItems.map((component: any, index: number) => {
									const groupPosition =
										componentItems.length === 1
											? 'single'
											: index === 0
												? 'top'
												: index === componentItems.length - 1
													? 'bottom'
													: 'middle';
									return (
										<AttributeItem
											key={component?.id ?? `component-${index}`}
											attr={{
												id: component?.id ?? `component-${index}`,
												string_value: component?.alias,
												food_attribute: {
													status: 'published',
													translations: [],
												},
											}}
											groupPosition={groupPosition}
										/>
									);
								})}
							</View>
						)
					)}
				</View>
			)}

			<DebugView title="Foodoffer Markings Data" isVisible={isDevMode}>
				<Text style={{ ...styles.body, color: theme.screen.text }}>
					{JSON.stringify(
						{
							foodOfferMarkings: foodOfferDetails?.markings ?? foodOffer?.markings ?? [],
							mappedMarkings: mappedFoodOfferMarkings,
							sortedMarkings: foodMarkings,
						},
						null,
						2
					)}
				</Text>
			</DebugView>

			<DebugView title="Foodoffer Markings Count" isVisible={isDevMode}>
				<Text style={{ ...styles.body, color: theme.screen.text }}>{foodOfferDetails?.markings?.length ?? foodOffer?.markings?.length ?? 0}</Text>
			</DebugView>

			<FoodLabelingInfo textStyle={styles.body} backgroundColor={foods_area_color} />
		</View>
	);
};

export default Labels;