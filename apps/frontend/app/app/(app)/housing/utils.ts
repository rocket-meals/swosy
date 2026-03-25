import { ApartmentSortOption, DatabaseTypes } from 'repo-depkit-common';
import { calculateDistanceInMeter } from '@/helper/distanceHelper';

export const sortApartmentsIntelligently = (apartments: DatabaseTypes.Apartments[]) => {
	if (!apartments) return apartments;

	return [...apartments].sort((a: any, b: any) => {
		const dateA = a.available_from ? new Date(a.available_from).getTime() : null;
		const dateB = b.available_from ? new Date(b.available_from).getTime() : null;

		if (dateA !== dateB) {
			if (dateA === null) return -1;
			if (dateB === null) return 1;
			if (dateA !== dateB) return dateA - dateB;
		}

		const distanceDiff = (a.distance || 0) - (b.distance || 0);
		if (distanceDiff !== 0) return distanceDiff;

		return (a.alias || '').localeCompare(b.alias || '');
	});
};

export const sortApartmentsWithDistance = (apartments: DatabaseTypes.Apartments[]) => {
	if (apartments) {
		return [...apartments].sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
	} else {
		return apartments;
	}
};

export const sortApartmentsAlphabetically = (apartments: DatabaseTypes.Apartments[]) => {
	if (apartments) {
		return [...apartments].sort((a: any, b: any) => (a.alias || '').localeCompare(b.alias || ''));
	} else {
		return apartments;
	}
};

export const sortApartmentsByAvailableDate = (apartments: DatabaseTypes.Apartments[]) => {
	if (!apartments) return apartments;

	return [...apartments].sort((a, b) => {
		const availableFromA = a.available_from ? new Date(a.available_from) : null;
		const availableFromB = b.available_from ? new Date(b.available_from) : null;

		if (availableFromA && availableFromB) {
			return availableFromA.getTime() - availableFromB.getTime();
		} else if (availableFromA) {
			return -1;
		} else if (availableFromB) {
			return 1;
		}
		return 0;
	});
};

export const addDistanceToApartments = (
	apartments: DatabaseTypes.Apartments[],
	selectedBuilding: DatabaseTypes.Buildings | null | undefined
): DatabaseTypes.Apartments[] => {
	if (!apartments || !selectedBuilding) return apartments;

	const campusWithDistance: Array<DatabaseTypes.Apartments> = [];
	
    // Ensure coordinates exist
    const buildingCoords = (selectedBuilding as any)?.coordinates?.coordinates;
    if (!buildingCoords) return apartments;

    apartments.forEach((apartment: any) => {
        const aptCoords = apartment?.coordinates?.coordinates;
        const distance = aptCoords ? Number(calculateDistanceInMeter(buildingCoords, aptCoords)) : 0;
        campusWithDistance.push({ ...apartment, distance });
    });

    if (campusWithDistance.length === 0) {
        return apartments;
    }
    return campusWithDistance;
};

export const getSortedApartments = (
    apartments: DatabaseTypes.Apartments[],
    sortBy: ApartmentSortOption
) => {
    switch (sortBy) {
        case ApartmentSortOption.INTELLIGENT:
            return sortApartmentsIntelligently(apartments);
        case ApartmentSortOption.ALPHABETICAL:
            return sortApartmentsAlphabetically(apartments);
        case ApartmentSortOption.DISTANCE:
            return sortApartmentsWithDistance(apartments);
        case ApartmentSortOption.FREE_ROOMS:
            return sortApartmentsByAvailableDate(apartments);
        default:
            return apartments;
    }
};
