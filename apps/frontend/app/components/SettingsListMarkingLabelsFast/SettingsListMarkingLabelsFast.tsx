import React from 'react';
import SettingsListMarkingLabelFast from '../SettingsListMarkingLabelFast';

export interface SettingsListMarkingLabelsFastProps {
	markingIds: string[];
	handleMenuSheet?: () => void;
	size?: number;
}

const SettingsListMarkingLabelsFast: React.FC<SettingsListMarkingLabelsFastProps> = ({
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
					<SettingsListMarkingLabelFast
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

export default SettingsListMarkingLabelsFast;
