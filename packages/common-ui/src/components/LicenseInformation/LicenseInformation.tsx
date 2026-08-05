import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * A single entry of the auto-generated open-source license list
 * (see packages/common/licenses/collectLicenses.cjs).
 */
export type LicensePackageInfo = {
	name: string;
	version: string;
	license: string;
	repository?: string;
	licenseUrl?: string;
};

export type LicenseInformationProps = {
	packages: LicensePackageInfo[];
	/** Optional accent color for links. Defaults to a blue tone. */
	linkColor?: string;
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
const LicenseInformation: React.FC<LicenseInformationProps> = ({ packages, linkColor = '#2563eb' }) => {
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
						>
							<Text style={[styles.name, { color: theme.screen.text }]} numberOfLines={1}>
								{pkg.name}
							</Text>
							<View style={styles.headerRight}>
								<Text style={[styles.version, { color: theme.screen.text }]}>{pkg.version}</Text>
								<Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.screen.icon} />
							</View>
						</TouchableOpacity>
						{isExpanded && (
							<View style={styles.details}>
								<DetailRow label="License" value={pkg.license} linkColor={linkColor} />
								{pkg.repository ? <DetailRow label="Repository" value={pkg.repository} url={pkg.repository} linkColor={linkColor} /> : null}
								{pkg.licenseUrl && pkg.licenseUrl !== pkg.repository ? (
									<DetailRow label="License URL" value={pkg.licenseUrl} url={pkg.licenseUrl} linkColor={linkColor} />
								) : null}
							</View>
						)}
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
