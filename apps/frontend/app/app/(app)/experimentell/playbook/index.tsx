import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useKioskMode from '@/hooks/useKioskMode';
import SettingsList from '@/components/SettingsList';
import { CommonUiComponentIds, getPlaybookPath, playbookRegistryData } from 'repo-depkit-common-ui';

/**
 * Playbook overview – lists every common-ui component registered in the
 * playbook registry (packages/common-ui/src/playbook). Tapping an entry opens
 * the generic detail screen where the component's props ("knobs") can be
 * tweaked live and via URL query parameters.
 */
const PlaybookIndex = () => {
	useSetPageTitle('Playbook');
	const { theme } = useTheme();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const kioskMode = useKioskMode();

	const openEntry = (name: string) => {
		router.push(`${getPlaybookPath(name)}${kioskMode ? '?kioskMode=true' : ''}`);
	};

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<Text style={{ ...styles.heading, color: theme.screen.text }}>Playbook</Text>
				<Text style={{ ...styles.body, color: theme.screen.text }}>Interactive gallery of all registered common-ui components. Props can also be set via URL query parameters, e.g. ?isEnabled=false</Text>
				<View style={styles.list}>
					{playbookRegistryData.map((entry, index) => {
						const totalItems = playbookRegistryData.length;
						let groupPosition: 'single' | 'top' | 'bottom' | 'middle';
						if (totalItems === 1) {
							groupPosition = 'single';
						} else if (index === 0) {
							groupPosition = 'top';
						} else if (index === totalItems - 1) {
							groupPosition = 'bottom';
						} else {
							groupPosition = 'middle';
						}

						return (
							<SettingsList
								key={entry.name}
								nativeID={CommonUiComponentIds.PLAYBOOK_ITEM_PREFIX + entry.name}
								iconBgColor={primaryColor}
								leftIcon={<MaterialCommunityIcons name="puzzle-outline" size={24} color={theme.screen.icon} />}
								title={entry.name}
								rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
								handleFunction={() => openEntry(entry.name)}
								groupPosition={groupPosition}
							/>
						);
					})}
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		width: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
	body: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		marginBottom: 10,
	},
	list: {
		width: '100%',
		marginTop: 10,
	},
});

export default PlaybookIndex;
