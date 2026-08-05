import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';
const DATABASE_COLOR = '#16a34a';
const ONLINE_COLOR = '#f59e0b';

type GroupPosition = 'single' | 'top' | 'bottom' | 'middle';

function getGroupPosition(index: number, total: number): GroupPosition {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
}

// ─── External tool catalog ────────────────────────────────────────────────────
//
// Each category is one row on the screen; tapping it opens a modal listing the
// external tools of that category. The links open in the browser (or the
// respective app) - nothing is embedded, the app only links out.

type ExternalTool = {
	id: string;
	name: string;
	description: string;
	url: string;
};

type ToolCategory = {
	id: string;
	label: string;
	value: string;
	modalTitle: string;
	hint: string;
	iconBgColor: string;
	iconName: React.ComponentProps<typeof Ionicons>['name'];
	tools: ExternalTool[];
};

const TOOL_CATEGORIES: ToolCategory[] = [
	{
		id: 'appointment',
		label: 'Termin-Abstimmung',
		value: 'Spieleabend-Termin finden',
		modalTitle: '📅 Termin-Abstimmung',
		hint: 'Mit diesen externen Diensten findet ihr einen Termin für den nächsten Spieleabend. Die Links öffnen sich außerhalb der App.',
		iconBgColor: PRIMARY_COLOR,
		iconName: 'calendar-outline',
		tools: [
			{ id: 'doodle', name: 'Doodle', description: 'Der Klassiker für Terminumfragen', url: 'https://doodle.com/' },
			{ id: 'dfn', name: 'DFN Terminplaner', description: 'Ohne Anmeldung, datenschutzfreundlich', url: 'https://terminplaner.dfn.de/' },
			{ id: 'nuudel', name: 'Nuudel', description: 'Von Digitalcourage, ohne Tracking', url: 'https://nuudel.digitalcourage.de/' },
			{ id: 'rallly', name: 'Rallly', description: 'Open-Source-Terminabstimmung', url: 'https://rallly.co/' },
		],
	},
	{
		id: 'databases',
		label: 'Spiele-Datenbanken',
		value: 'Regeln, Bewertungen & Infos',
		modalTitle: '📚 Spiele-Datenbanken',
		hint: 'Regeln nachschlagen, Bewertungen lesen oder neue Spiele entdecken.',
		iconBgColor: DATABASE_COLOR,
		iconName: 'library-outline',
		tools: [
			{ id: 'bgg', name: 'BoardGameGeek', description: 'Die größte Brettspiel-Datenbank (englisch)', url: 'https://boardgamegeek.com/' },
			{ id: 'spielregeln', name: 'Spielregeln.de', description: 'Spielregeln auf Deutsch nachschlagen', url: 'https://www.spielregeln.de/' },
		],
	},
	{
		id: 'online-play',
		label: 'Online spielen',
		value: 'Brettspiele im Browser',
		modalTitle: '🎮 Online spielen',
		hint: 'Wenn ihr nicht am selben Tisch sitzt: Hier könnt ihr Brettspiele online miteinander spielen.',
		iconBgColor: ONLINE_COLOR,
		iconName: 'game-controller-outline',
		tools: [
			{ id: 'bga', name: 'Board Game Arena', description: 'Hunderte Brettspiele online spielen', url: 'https://boardgamearena.com/' },
			{ id: 'tabletopia', name: 'Tabletopia', description: 'Brettspiele in 3D im Browser', url: 'https://tabletopia.com/' },
		],
	},
];

function openExternalUrl(url: string) {
	Linking.openURL(url).catch((err) => {
		console.warn('[Tools] Failed to open external link:', url, err);
	});
}

// ─── Modal content: list of external links ────────────────────────────────────

function ToolLinkList({ category }: Readonly<{ category: ToolCategory }>) {
	const { theme } = useTheme();
	return (
		<View style={styles.modalContainer}>
			<Text style={[styles.hintText, { color: theme.screen.placeholder }]}>{category.hint}</Text>
			{category.tools.map((tool, index) => (
				<SettingsList
					key={tool.id}
					nativeID={ComponentIds.TOOLS_LINK_ROW_PREFIX + tool.id}
					iconBgColor={category.iconBgColor}
					leftIcon={<Ionicons name="globe-outline" size={22} color="#ffffff" />}
					label={tool.name}
					value={tool.description}
					rightIcon={<Ionicons name="open-outline" size={20} color="#9ca3af" />}
					handleFunction={() => openExternalUrl(tool.url)}
					groupPosition={getGroupPosition(index, category.tools.length)}
				/>
			))}
		</View>
	);
}

// ─── Tools screen ─────────────────────────────────────────────────────────────

export default function ToolsScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { show: showModal } = useMyScrollViewModal();

	const handleOpenCategory = useCallback(
		(category: ToolCategory) => {
			showModal({
				title: category.modalTitle,
				children: <ToolLinkList category={category} />,
			});
		},
		[showModal]
	);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32, paddingLeft: insets.left, paddingRight: insets.right }]}>
				<Text style={[styles.introText, { color: theme.screen.placeholder }]}>
					Nützliche externe Dienste rund um den Spieleabend. Die Links öffnen sich außerhalb der App.
				</Text>

				<SettingsListGroupTitle title="Externe Tools" />
				{TOOL_CATEGORIES.map((category, index) => (
					<SettingsList
						key={category.id}
						nativeID={ComponentIds.TOOLS_CATEGORY_ROW_PREFIX + category.id}
						iconBgColor={category.iconBgColor}
						leftIcon={<Ionicons name={category.iconName} size={22} color="#ffffff" />}
						label={category.label}
						value={category.value}
						rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
						handleFunction={() => handleOpenCategory(category)}
						groupPosition={getGroupPosition(index, TOOL_CATEGORIES.length)}
					/>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {},
	introText: {
		fontSize: 14,
		lineHeight: 20,
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	modalContainer: {
		paddingBottom: 24,
	},
	hintText: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 12,
	},
});
