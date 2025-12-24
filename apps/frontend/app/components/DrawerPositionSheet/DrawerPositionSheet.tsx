import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useSelector } from 'react-redux';
import styles from './styles';
import { DrawerPositionSheetProps } from './types';
import { drawers } from '@/constants/SettingData';
import { RootState } from '@/redux/reducer';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DrawerPositionSheet: React.FC<DrawerPositionSheetProps> = ({ closeSheet, selectedPosition, onSelect }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useSelector((state: RootState) => state.settings);

	return (
		<View style={styles.sheetView}>
			<View style={styles.optionsContainer}>
				{drawers.map((drawer, index) => {
					const isSelected = selectedPosition === drawer.id;
					const groupPosition =
						drawers.length === 1
							? 'single'
							: index === 0
								? 'top'
								: index === drawers.length - 1
									? 'bottom'
									: 'middle';

					return (
						<SettingsList
							key={drawer.id}
							label={translate(drawer.name)}
							leftIcon={<MaterialCommunityIcons name={drawer.icon as any} size={24} />}
							iconBgColor={primaryColor}
							groupPosition={groupPosition}
							showSeparator={index !== drawers.length - 1}
							rightIcon={
								<MaterialCommunityIcons
									name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
									size={24}
									color={isSelected ? primaryColor : theme.screen.icon}
								/>
							}
							handleFunction={() => {
								onSelect(drawer.id);
								closeSheet();
							}}
						/>
					);
				})}
			</View>
			<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_settings_menuposition} />
		</View>
	);
};

export default DrawerPositionSheet;
