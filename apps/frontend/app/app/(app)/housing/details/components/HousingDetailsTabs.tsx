import React, { memo } from 'react';
import { View } from 'react-native';
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { DatabaseTypes } from 'repo-depkit-common';

import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';

interface HousingDetailsTabsProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
	theme: any;
	themeStyles: any;
	contrastColor: string;
	translate: (key: string) => string;
	apartmentDetails: DatabaseTypes.Apartments | null;
	screenWidth: number;
}

const HousingDetailsTabs: React.FC<HousingDetailsTabsProps> = ({
	activeTab,
	setActiveTab,
	theme,
	themeStyles,
	contrastColor,
	translate,
	apartmentDetails,
	screenWidth,
}) => {
	const renderTab = (
		key: string,
		icon: React.ReactNode,
		translationKey: string
	) => (
		<CustomTooltip
			key={key}
			placement="top"
			trigger={(triggerProps) => (
				<IconButton
					{...triggerProps}
					style={[
						styles.tab,
						activeTab === key ? themeStyles : { backgroundColor: theme.screen.iconBg },
					]}
					onPress={() => setActiveTab(key)}
				>
					{icon}
				</IconButton>
			)}
		>
			<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
				<TooltipText fontSize="$sm" color={theme.tooltip.text}>
					{translate(translationKey)}
				</TooltipText>
			</TooltipContent>
		</CustomTooltip>
	);

	return (
		<View
			style={[
				styles.tabs,
				{
					width: '100%',
					gap: screenWidth > 900 ? 20 : 0,
				},
			]}
		>
			{renderTab(
				'information',
				<Foundation
					name="info"
					size={26}
					color={activeTab === 'information' ? contrastColor : theme.screen.icon}
				/>,
				TranslationKeys.information
			)}
			{renderTab(
				'description',
				<MaterialCommunityIcons
					name="sort-variant"
					size={26}
					color={activeTab === 'description' ? contrastColor : theme.screen.icon}
				/>,
				TranslationKeys.description
			)}

			{apartmentDetails &&
				(apartmentDetails as any)?.washingmachines?.length > 0 &&
				renderTab(
					'washing-machine',
					<MaterialCommunityIcons
						name="washing-machine"
						size={26}
						color={activeTab === 'washing-machine' ? contrastColor : theme.screen.icon}
					/>,
					TranslationKeys.washing_machine
				)}
		</View>
	);
};

export default memo(HousingDetailsTabs);
