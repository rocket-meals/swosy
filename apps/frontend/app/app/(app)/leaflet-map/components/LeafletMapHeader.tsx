import React, { memo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import IconButton from '@/components/UI/IconButton';
import { TranslationKeys } from '@/locales/keys';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { isWeb } from '@/constants/Constants';

type RootDrawerParamList = Record<string, undefined>;

interface LeafletMapHeaderProps {
	drawerPosition: 'left' | 'right' | 'system' | undefined;
	query: string;
	onQueryChange: (text: string) => void;
}

const LeafletMapHeader: React.FC<LeafletMapHeaderProps> = ({
	drawerPosition,
	query,
	onQueryChange,
}) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const router = useRouter();
	const drawerNavigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

	const isRTL = drawerPosition === 'right';
	const rowDirection = isRTL ? 'row-reverse' : 'row';

	return (
		<View style={[styles.header, { backgroundColor: theme.header.background }]}>
			<View style={[styles.row, { flexDirection: rowDirection }]}>
				{/* Burger Menu */}
				<CustomTooltip
					placement="bottom"
					trigger={triggerProps => (
						<IconButton
							{...triggerProps}
							onPress={() => drawerNavigation.toggleDrawer()}
							style={styles.iconButton}
						>
							<Ionicons name="menu" size={24} color={theme.header.text} />
						</IconButton>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{translate(TranslationKeys.open_drawer)}
						</TooltipText>
					</TooltipContent>
				</CustomTooltip>

				{/* Search Bar */}
				<TextInput
					style={[
						styles.searchInput,
						{
							color: theme.header.text,
							borderColor: theme.header.text + '55',
							backgroundColor: theme.header.text + '15',
						},
					]}
					cursorColor={theme.header.text}
					placeholderTextColor={theme.header.text + '88'}
					value={query}
					onChangeText={onQueryChange}
					placeholder={translate(TranslationKeys.search)}
				/>

				{/* Filter Icon */}
				<CustomTooltip
					placement="bottom"
					trigger={triggerProps => (
						<IconButton
							{...triggerProps}
							onPress={() => {}}
							style={styles.iconButton}
						>
							<Ionicons name="filter" size={24} color={theme.header.text} />
						</IconButton>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{translate(TranslationKeys.filter)}
						</TooltipText>
					</TooltipContent>
				</CustomTooltip>

				{/* Settings Cog */}
				<CustomTooltip
					placement="bottom"
					trigger={triggerProps => (
						<IconButton
							{...triggerProps}
							onPress={() => router.navigate('/settings')}
							style={styles.iconButton}
						>
							<Ionicons name="settings-outline" size={24} color={theme.header.text} />
						</IconButton>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{translate(TranslationKeys.settings)}
						</TooltipText>
					</TooltipContent>
				</CustomTooltip>
			</View>
		</View>
	);
};

export default memo(LeafletMapHeader);

const styles = StyleSheet.create({
	header: {
		width: '100%',
		paddingHorizontal: isWeb ? 20 : 10,
		paddingVertical: 8,
	},
	row: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	iconButton: {
		padding: 8,
	},
	searchInput: {
		flex: 1,
		height: 40,
		borderRadius: 20,
		paddingHorizontal: 16,
		borderWidth: 1,
		fontFamily: 'Poppins_400Regular',
		fontSize: 15,
	},
});
