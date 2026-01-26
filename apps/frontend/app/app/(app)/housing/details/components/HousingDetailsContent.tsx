import React, { memo } from 'react';
import { DatabaseTypes } from 'repo-depkit-common';
import LocationInformation from '@/components/LocationInformation/LocationInformation';
import BuildingDescription from '@/components/BuildingDescription';
import WashingMachines from '@/components/WashingMachines';

interface HousingDetailsContentProps {
	activeTab: string;
	apartmentDetails: DatabaseTypes.Apartments | null;
}

const HousingDetailsContent: React.FC<HousingDetailsContentProps> = ({
	activeTab,
	apartmentDetails,
}) => {
	switch (activeTab) {
		case 'information':
			return <LocationInformation campusDetails={apartmentDetails} />;
		case 'description':
			return <BuildingDescription campusDetails={apartmentDetails} />;
		case 'washing-machine':
			return <WashingMachines campusDetails={apartmentDetails} />;
		default:
			return null;
	}
};

export default memo(HousingDetailsContent);
