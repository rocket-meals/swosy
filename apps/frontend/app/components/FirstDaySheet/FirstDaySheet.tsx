import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { days } from '@/constants/SettingData';
import styles from './styles';
import { FirstDaySheetProps } from './types';
import { TranslationKeys } from '@/locales/keys';
import CollectibleSpot from '../CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const FirstDaySheet: React.FC<FirstDaySheetProps> = ({ closeSheet, selectedDay, onSelect }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useSelector((state: RootState) => state.settings);

	return (
		<View style={styles.sheetView}>
			<View style={styles.optionsContainer}>
				{days.map((firstDay, index) => {
					const isSelected = selectedDay === firstDay.name;
					const groupPosition =
						days.length === 1
							? 'single'
							: index === 0
								? 'top'
								: index === days.length - 1
									? 'bottom'
									: 'middle';

					return (
						<SettingsList
							key={firstDay.id}
							label={translate(firstDay.name)}
							groupPosition={groupPosition}
							showSeparator={index !== days.length - 1}
							noIconIndent
							rightIcon={
								<MaterialCommunityIcons
									name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
									size={24}
									color={isSelected ? primaryColor : theme.screen.icon}
								/>
							}
							handleFunction={() => {
								onSelect({ id: firstDay.id, name: firstDay.name });
								closeSheet();
							}}
						/>
					);
				})}
			</View>
			<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_settings_first_day_of_week} />
		</View>
	);
};

export default FirstDaySheet;
