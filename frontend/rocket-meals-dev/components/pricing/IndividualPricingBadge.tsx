import {Foodoffers} from '@/helper/database/databaseTypes/types';
import PricingBadge, {PricingBadgeProps} from '@/components/pricing/PricingBadge';
import useProfilePricing from '@/components/pricing/useProfilePricing';

export type IndivididualPricingBadgeProps = {
    foodOffer: Foodoffers,
    badgeProps?: Omit<PricingBadgeProps, 'price'>
}

export default function IndividualPricingBadge(props: IndivididualPricingBadgeProps) {
	const profilePricing = useProfilePricing(props.foodOffer);

	if (!profilePricing) {
		return null;
	}

	return (
		<PricingBadge {...props.badgeProps} price={profilePricing}/>
	)
}