import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { AmountColumn } from '@/constants/SettingData';
import styles from './styles';
import { AmountColumnSheetProps } from './types';
import { TranslationKeys } from '@/locales/keys';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const AmountColumnSheet: React.FC<AmountColumnSheetProps> = ({ closeSheet, selectedAmount, onSelect }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useSelector((state: RootState) => state.settings);

	return (
		<View style={styles.sheetView}>
			<View style={styles.optionsContainer}>
				{AmountColumn.map((column, index) => {
					const isSelected = selectedAmount === column.id;
					const groupPosition =
						AmountColumn.length === 1
							? 'single'
							: index === 0
								? 'top'
								: index === AmountColumn.length - 1
									? 'bottom'
									: 'middle';

					return (
						<SettingsList
							key={column.id}
							label={column.id === 0 ? translate(TranslationKeys.automatic) : column.name}
							groupPosition={groupPosition}
							showSeparator={index !== AmountColumn.length - 1}
							noIconIndent
							rightIcon={
								<MaterialCommunityIcons
									name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
									size={24}
									color={isSelected ? primaryColor : theme.screen.icon}
								/>
							}
							handleFunction={() => {
								onSelect(column.id);
								closeSheet();
							}}
						/>
					);
				})}
			</View>
			<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_settings_amount_column} />
		</View>
	);
};

export default AmountColumnSheet;
