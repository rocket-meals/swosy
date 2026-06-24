import React, { memo } from 'react';
import { DatabaseTypes } from 'repo-depkit-common';
import LocationInformation from '@/components/LocationInformation/LocationInformation';
import BuildingDescription from '@/components/BuildingDescription';
import WashingMachines from '@/components/WashingMachines';
import { HousingDetailTab } from '@/constants/TabEnums';

interface HousingDetailsContentProps {
	activeTab: HousingDetailTab;
	apartmentDetails: DatabaseTypes.Apartments | null;
}

const HousingDetailsContent: React.FC<HousingDetailsContentProps> = ({
	activeTab,
	apartmentDetails,
}) => {
	switch (activeTab) {
		case HousingDetailTab.INFORMATION:
			return <LocationInformation campusDetails={apartmentDetails} />;
		case HousingDetailTab.DESCRIPTION:
			return <BuildingDescription campusDetails={apartmentDetails} />;
		case HousingDetailTab.WASHING_MACHINE:
			return <WashingMachines campusDetails={apartmentDetails} />;
		default:
			return <LocationInformation campusDetails={apartmentDetails} />;
	}
};

export default memo(HousingDetailsContent);
