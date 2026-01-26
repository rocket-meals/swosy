import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';

import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import { isWeb } from '@/constants/Constants';
import { RootDrawerParamList } from '../types';
import styles from '../styles';

interface HousingHeaderProps {
	theme: any;
	translate: (key: string) => string;
	drawerPosition: 'left' | 'right' | 'system' | string;
	openHousingSortingModal: () => void;
}

const HousingHeader: React.FC<HousingHeaderProps> = ({
	theme,
	translate,
	drawerPosition,
	openHousingSortingModal,
}) => {
	const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

	return (
		<View
			style={[
				styles.header,
				{
					backgroundColor: theme.header.background,
					paddingHorizontal: isWeb ? 20 : 10,
				},
			]}
		>
			<View
				style={[
					styles.row,
					{
						flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row',
					},
				]}
			>
				<View
					style={[
						styles.col1,
						{
							flexDirection: drawerPosition === 'right' ? 'row-reverse' : 'row',
						},
					]}
				>
					<Tooltip
						placement="top"
						trigger={(triggerProps) => (
							<IconButton
								{...triggerProps}
								onPress={() => navigation.toggleDrawer()}
								style={{ padding: 10 }}
							>
								<Ionicons name="menu" size={24} color={theme.header.text} />
							</IconButton>
						)}
					>
						<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
							<TooltipText fontSize="$sm" color={theme.tooltip.text}>
								{`${translate(TranslationKeys.open_drawer)}`}
							</TooltipText>
						</TooltipContent>
					</Tooltip>

					<Text style={[styles.heading, { color: theme.header.text }]}>
						{translate(TranslationKeys.housing)}
					</Text>
				</View>
				<View style={[styles.col2, { gap: isWeb ? 30 : 15 }]}>
					<Tooltip
						placement="top"
						trigger={(triggerProps) => (
							<IconButton
								{...triggerProps}
								onPress={openHousingSortingModal}
								style={{ padding: 10 }}
							>
								<MaterialIcons name="sort" size={24} color={theme.header.text} />
							</IconButton>
						)}
					>
						<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
							<TooltipText fontSize="$sm" color={theme.tooltip.text}>
								{`${translate(TranslationKeys.sort)}: ${translate(TranslationKeys.apartments)}`}
							</TooltipText>
						</TooltipContent>
					</Tooltip>
				</View>
			</View>
		</View>
	);
};

export default memo(HousingHeader);
