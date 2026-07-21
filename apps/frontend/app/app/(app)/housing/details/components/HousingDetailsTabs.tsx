import React, { memo } from 'react';
import { View } from 'react-native';
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { DatabaseTypes } from 'repo-depkit-common';

import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';
import { TabsStyleProps } from '@/components/shared/tabsStyleProps';
import { HousingDetailTab } from '@/constants/TabEnums';

interface HousingDetailsTabsProps extends TabsStyleProps {
	activeTab: HousingDetailTab;
	setActiveTab: (tab: HousingDetailTab) => void;
	translate: (key: string) => string;
	apartmentDetails: DatabaseTypes.Apartments | null;
}

const TabIconButton = ({
	triggerProps,
	onPress,
	isActive,
	activeStyle,
	inactiveStyle,
	children,
}: {
	triggerProps: object;
	onPress: () => void;
	isActive: boolean;
	activeStyle: any;
	inactiveStyle: any;
	children: React.ReactNode;
}) => (
	<IconButton {...triggerProps} style={[styles.tab, isActive ? activeStyle : inactiveStyle]} onPress={onPress}>
		{children}
	</IconButton>
);

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
		key: HousingDetailTab,
		icon: React.ReactNode,
		translationKey: string
	) => (
		<CustomTooltip
			key={key}
			placement="top"
			trigger={(triggerProps) => (
				<TabIconButton
					triggerProps={triggerProps}
					onPress={() => setActiveTab(key)}
					isActive={activeTab === key}
					activeStyle={themeStyles}
					inactiveStyle={{ backgroundColor: theme.screen.iconBg }}
				>
					{icon}
				</TabIconButton>
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
				HousingDetailTab.INFORMATION,
				<Foundation
					name="info"
					size={26}
					color={activeTab === HousingDetailTab.INFORMATION ? contrastColor : theme.screen.icon}
				/>,
				TranslationKeys.information
			)}
			{renderTab(
				HousingDetailTab.DESCRIPTION,
				<MaterialCommunityIcons
					name="sort-variant"
					size={26}
					color={activeTab === HousingDetailTab.DESCRIPTION ? contrastColor : theme.screen.icon}
				/>,
				TranslationKeys.description
			)}

			{apartmentDetails &&
				(apartmentDetails as any)?.washingmachines?.length > 0 &&
				renderTab(
					HousingDetailTab.WASHING_MACHINE,
					<MaterialCommunityIcons
						name="washing-machine"
						size={26}
						color={activeTab === HousingDetailTab.WASHING_MACHINE ? contrastColor : theme.screen.icon}
					/>,
					TranslationKeys.washing_machine
				)}
		</View>
	);
};

export default memo(HousingDetailsTabs);
