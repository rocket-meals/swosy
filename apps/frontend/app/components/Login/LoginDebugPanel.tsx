import React, { useState, useSyncExternalStore } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import SettingsList from '@/components/SettingsList';
import SettingsListSelectOptionSingle from '@/components/SettingsListSelectOptionSingle/SettingsListSelectOptionSingle';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import { getSelectedLoginBrowserStrategy, LOGIN_BROWSER_STRATEGY_LABELS, LoginBrowserStrategy, setSelectedLoginBrowserStrategy } from '@/helper/authHelper';
import { clearLoginLog, getLoginLogEntries, getLoginLogText, subscribeLoginLog } from '@/helper/loginDebug';
import { useAppSelector } from '@/redux/hooks';

/** Position of the item at `index` inside a settings group of `total` items. */
const getGroupPosition = (index: number, total: number): 'top' | 'bottom' | 'middle' => {
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
};

// Debug panel to diagnose the native SSO login on real devices: lets the user
// switch between the browser strategies in helper/authHelper.ts and shows the
// login debug log with a copy button, so failing devices can report what
// happened at every step of the flow.
const LoginDebugPanel: React.FC = () => {
	const { theme } = useTheme();
	const { primaryColor } = useAppSelector(state => state.settings);
	// The panel is only rendered after the hidden long-press gesture on the app
	// logo, so it starts expanded.
	const [expanded, setExpanded] = useState(true);
	const [selectedStrategy, setSelectedStrategy] = useState<LoginBrowserStrategy>(getSelectedLoginBrowserStrategy());
	const [copied, setCopied] = useState(false);
	const logEntries = useSyncExternalStore(subscribeLoginLog, getLoginLogEntries, getLoginLogEntries);

	const strategies = Object.values(LoginBrowserStrategy);

	const onSelectStrategy = (strategy: LoginBrowserStrategy) => {
		setSelectedLoginBrowserStrategy(strategy);
		setSelectedStrategy(strategy);
	};

	const onCopyLog = async () => {
		try {
			await Clipboard.setStringAsync(getLoginLogText() || '(Log ist leer)');
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Could not copy login log:', error);
		}
	};

	return (
		<View style={styles.container}>
			<SettingsList
				label="Login-Debug"
				leftIcon={<MaterialCommunityIcons name="bug-outline" size={22} color={theme.screen.text} />}
				rightIcon={<MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={theme.screen.icon} />}
				groupPosition="single"
				handleFunction={() => setExpanded(current => !current)}
			/>
			{expanded && (
				<>
					<SettingsGroupTitle>Login-Methode</SettingsGroupTitle>
					{strategies.map((strategy, index) => (
						<SettingsListSelectOptionSingle
							key={strategy}
							label={LOGIN_BROWSER_STRATEGY_LABELS[strategy]}
							isSelected={selectedStrategy === strategy}
							selectionColor={primaryColor || theme.screen.text}
							onPress={() => onSelectStrategy(strategy)}
							groupPosition={getGroupPosition(index, strategies.length)}
							showSeparator={index < strategies.length - 1}
						/>
					))}
					<SettingsGroupTitle>{`Log (${logEntries.length})`}</SettingsGroupTitle>
					<View style={[styles.logBox, { borderColor: theme.screen.icon }]}>
						<ScrollView style={styles.logScroll} nestedScrollEnabled>
							{logEntries.length === 0 ? (
								<Text style={[styles.logText, { color: theme.screen.text }]}>Noch keine Einträge - starte einen Login.</Text>
							) : (
								logEntries.map((entry, index) => (
									<Text key={`${index}-${entry}`} style={[styles.logText, { color: theme.screen.text }]} selectable>
										{entry}
									</Text>
								))
							)}
						</ScrollView>
					</View>
					<View style={styles.buttonRow}>
						<TouchableOpacity style={[styles.button, { backgroundColor: primaryColor || theme.screen.icon }]} onPress={onCopyLog}>
							<MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={18} color={theme.screen.background} />
							<Text style={[styles.buttonText, { color: theme.screen.background }]}>{copied ? 'Kopiert' : 'Log kopieren'}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.button, { backgroundColor: theme.screen.icon }]} onPress={clearLoginLog}>
							<MaterialCommunityIcons name="delete-outline" size={18} color={theme.screen.background} />
							<Text style={[styles.buttonText, { color: theme.screen.background }]}>Log leeren</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
		</View>
	);
};

export default LoginDebugPanel;

const styles = StyleSheet.create({
	container: {
		width: '100%',
		marginTop: 24,
	},
	logBox: {
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 8,
		padding: 8,
		maxHeight: 220,
	},
	logScroll: {
		flexGrow: 0,
	},
	logText: {
		fontSize: 11,
		fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
		marginBottom: 2,
	},
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 10,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
	},
});
