import {Foodoffers} from '@/helper/database/databaseTypes/types';
import PricingBadge, {formatPrice, PricingBadgeProps} from '@/components/pricing/PricingBadge';
import useProfilePricing from '@/components/pricing/useProfilePricing';
import {
	useGlobalActionSheetSettingPriceGroup,
	usePriceGroupSelectedName
} from "@/compositions/settings/SettingsRowPriceGroup";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export type IndivididualPricingBadgeProps = {
    foodOffer: Foodoffers,
    badgeProps?: Omit<PricingBadgeProps, 'price'>
}

export default function IndividualPricingBadge(props: IndivididualPricingBadgeProps) {
	const profilePricing = useProfilePricing(props.foodOffer);

	const onPress = useGlobalActionSheetSettingPriceGroup();

	const title = useTranslation(TranslationKeys.price_group)

	const translation_edit = useTranslation(TranslationKeys.edit)

	const selectedPriceGroupName = usePriceGroupSelectedName();

	if (!profilePricing) {
		return null;
	}

	const priceContent: string = formatPrice(profilePricing);

	const accessibilityLabel = `${priceContent} - ${title}: ${selectedPriceGroupName}: ${translation_edit}`;

	return (
		<MyTouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress} >
			<PricingBadge {...props.badgeProps} price={profilePricing}/>
		</MyTouchableOpacity>
	)
}