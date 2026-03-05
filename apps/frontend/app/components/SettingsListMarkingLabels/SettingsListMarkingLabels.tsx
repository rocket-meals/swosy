import React from 'react';
import SettingsListMarkingLabel from '../SettingsListMarkingLabel';

export interface SettingsListMarkingLabelsProps {
	markingIds: string[];
	handleMenuSheet?: () => void;
	size?: number;
}

const SettingsListMarkingLabels: React.FC<SettingsListMarkingLabelsProps> = ({
	markingIds,
	handleMenuSheet,
	size,
}) => {
	if (!markingIds || markingIds.length === 0) return null;

	return (
		<>
			{markingIds.map((markingId, index) => {
				let groupPosition: 'top' | 'middle' | 'bottom' | 'single';
				if (markingIds.length === 1) {
					groupPosition = 'single';
				} else if (index === 0) {
					groupPosition = 'top';
				} else if (index === markingIds.length - 1) {
					groupPosition = 'bottom';
				} else {
					groupPosition = 'middle';
				}

				return (
					<SettingsListMarkingLabel
						key={markingId}
						markingId={markingId}
						handleMenuSheet={handleMenuSheet}
						size={size}
						groupPosition={groupPosition}
					/>
				);
			})}
		</>
	);
};

export default SettingsListMarkingLabels;
