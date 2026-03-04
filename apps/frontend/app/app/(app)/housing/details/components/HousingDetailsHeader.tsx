import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { DatabaseTypes } from 'repo-depkit-common';

import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';

interface HousingDetailsHeaderProps {
	apartmentDetails: DatabaseTypes.Apartments | null;
	theme: any;
	screenWidth: number;
	translate: (key: string) => string;
	onOpenNavigation: () => void;
}

const HousingDetailsHeader: React.FC<HousingDetailsHeaderProps> = ({
	apartmentDetails,
	theme,
	screenWidth,
	translate,
	onOpenNavigation,
}) => {
	if (!apartmentDetails) return null;

	return (
		<View style={{ width: '100%' }}>
			<Text style={[styles.buildingHeading, { color: theme.screen.text }]}>
				{(apartmentDetails as any)?.alias}
			</Text>
			<View
				style={{
					width: '98%',
					flexDirection: 'row',
					justifyContent: screenWidth > 900 ? 'flex-start' : 'flex-end',
					gap: 10,
				}}
			>
				<Tooltip
					placement="top"
					trigger={(triggerProps) => (
						<IconButton
							{...triggerProps}
							style={[
								styles.navigationButton,
								{ backgroundColor: theme.screen.iconBg },
							]}
							onPress={onOpenNavigation}
						>
							<MaterialCommunityIcons
								name="navigation-variant"
								size={24}
								color={theme.screen.icon}
							/>
						</IconButton>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{translate(TranslationKeys.open_navitation_to_location)}
						</TooltipText>
					</TooltipContent>
				</Tooltip>
			</View>
		</View>
	);
};

export default memo(HousingDetailsHeader);
