import {Foodoffers} from '@/helper/database/databaseTypes/types';
import {PriceGroups, useProfilePriceGroup} from '@/states/SynchedProfile';

export default function useProfilePricing(foodOfferData: Foodoffers | undefined) {
	const [priceGroup, setPriceGroup] = useProfilePriceGroup();
	return getPriceForPriceGroup(foodOfferData, priceGroup);
}

export function getPriceForPriceGroup(foodOfferData: Foodoffers | undefined, priceGroup: PriceGroups) {
	let price = foodOfferData?.price_student;
	switch (priceGroup) {
	case PriceGroups.Student:
		price = foodOfferData?.price_student;
		break;
	case PriceGroups.Employee:
		price = foodOfferData?.price_employee;
		break;
	case PriceGroups.Guest:
		price = foodOfferData?.price_guest;
		break;
	}

	return price;
}