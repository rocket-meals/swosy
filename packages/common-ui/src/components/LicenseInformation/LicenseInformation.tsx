import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import CollapsibleView from '../Collapsible/CollapsibleView';
import type { LicenseEntry } from 'repo-depkit-common';

/**
 * A single entry of the auto-collected open-source license list. Same shape the collector
 * writes (see packages/common/licenses/collectLicenses.ts), kept under the component's own
 * name because that is what consumers import.
 */
export type LicensePackageInfo = LicenseEntry;

/**
 * Row labels of the expanded package details.
 *
 * The component is translation-agnostic: the app resolves its own translation keys and
 * passes the finished strings in. {@link LICENSE_INFORMATION_FALLBACK_TEXTS} keeps the
 * component usable without them.
 */
export type LicenseInformationTexts = {
	license: string;
	repository: string;
	licenseUrl: string;
};

/** English fallback used when an app passes no `texts`. */
export const LICENSE_INFORMATION_FALLBACK_TEXTS: LicenseInformationTexts = {
	license: 'License',
	repository: 'Repository',
	licenseUrl: 'License URL',
};

export type LicenseInformationProps = {
	packages: LicensePackageInfo[];
	/** Optional accent color for links. Defaults to a blue tone. */
	linkColor?: string;
	/** Row labels. Defaults to {@link LICENSE_INFORMATION_FALLBACK_TEXTS}. */
	texts?: LicenseInformationTexts;
};

function DetailRow({ label, value, url, linkColor }: Readonly<{ label: string; value: string; url?: string; linkColor: string }>) {
	const { theme } = useTheme();
	return (
		<View style={styles.detailRow}>
			<Text style={[styles.detailLabel, { color: theme.screen.placeholder }]}>{label}</Text>
			{url ? (
				<Text
					style={[styles.detailValue, { color: linkColor }]}
					onPress={() => Linking.openURL(url).catch(() => {})}
					numberOfLines={2}
				>
					{value}
				</Text>
			) : (
				<Text style={[styles.detailValue, { color: theme.screen.text }]} numberOfLines={2}>
					{value}
				</Text>
			)}
		</View>
	);
}

/**
 * Collapsible list of open-source packages with their installed version,
 * license and repository link. Renders plain views (no own ScrollView) so it
 * can be embedded in a screen or a scrollable modal.
 */
const LicenseInformation: React.FC<LicenseInformationProps> = ({
	packages,
	linkColor = '#2563eb',
	texts = LICENSE_INFORMATION_FALLBACK_TEXTS,
}) => {
	const { theme } = useTheme();
	const [expandedName, setExpandedName] = useState<string | null>(null);

	return (
		<View style={styles.container}>
			{packages.map((pkg) => {
				const isExpanded = expandedName === pkg.name;
				return (
					<View key={pkg.name} style={[styles.item, { borderColor: theme.screen.border }]}>
						<TouchableOpacity
							style={[styles.header, { backgroundColor: theme.screen.iconBg }]}
							onPress={() => setExpandedName(isExpanded ? null : pkg.name)}
							activeOpacity={0.7}
							accessibilityRole="button"
							accessibilityState={{ expanded: isExpanded }}
						>
							<Text style={[styles.name, { color: theme.screen.text }]} numberOfLines={1}>
								{pkg.name}
							</Text>
							<View style={styles.headerRight}>
								<Text style={[styles.version, { color: theme.screen.text }]}>{pkg.version}</Text>
								<Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.screen.icon} />
							</View>
						</TouchableOpacity>
						<CollapsibleView collapsed={!isExpanded}>
							<View style={styles.details}>
								<DetailRow label={texts.license} value={pkg.license} linkColor={linkColor} />
								{pkg.repository ? <DetailRow label={texts.repository} value={pkg.repository} url={pkg.repository} linkColor={linkColor} /> : null}
								{pkg.licenseUrl && pkg.licenseUrl !== pkg.repository ? (
									<DetailRow label={texts.licenseUrl} value={pkg.licenseUrl} url={pkg.licenseUrl} linkColor={linkColor} />
								) : null}
							</View>
						</CollapsibleView>
					</View>
				);
			})}
		</View>
	);
};

export default LicenseInformation;

const styles = StyleSheet.create({
	container: {
		gap: 8,
		paddingVertical: 8,
	},
	item: {
		borderRadius: 10,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: 'hidden',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 12,
		gap: 8,
	},
	name: {
		flex: 1,
		fontSize: 14,
		fontWeight: '600',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	version: {
		fontSize: 13,
	},
	details: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		gap: 6,
	},
	detailRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	detailLabel: {
		fontSize: 12,
	},
	detailValue: {
		flex: 1,
		fontSize: 12,
		textAlign: 'right',
	},
});
