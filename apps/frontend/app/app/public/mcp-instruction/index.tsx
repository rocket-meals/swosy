import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { McpAccessHelper } from 'repo-depkit-common';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import useToast from '@/hooks/useToast';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useCustomerConfig from '@/hooks/useCustomerConfig';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';
import SettingsList from '@/components/SettingsList';
import SettingsGroupTitle from '@/components/SettingsGroupTitle';
import MyMarkdownProjectColored from '@/components/MyMarkdownProjectColored';
import { ServerInfoHelper } from '@/helper/ServerInfoHelper';
import { UserHelper } from '@/helper/UserHelper';
import { authorizedFetch } from '@/helper/authorizedFetch';
import { myContrastColor } from '@/helper/ColorHelper';
import Server from '@/constants/ServerUrl';

type McpProvider = 'claude' | 'openai' | 'other';

/** Values the steps offer to copy. The token-based ones exist only once a token is loaded. */
type CopyValueKind = 'appName' | 'serverUrl' | 'authorizationHeader' | 'serverUrlWithToken';

type McpStep = {
	textKey: TranslationKeys;
	copy?: CopyValueKind;
};

const PROVIDER_OPTIONS: { provider: McpProvider; label: string | TranslationKeys; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
	// Brand names, not translated.
	{ provider: 'openai', label: 'OpenAI (ChatGPT)', icon: 'chat-processing-outline' },
	{ provider: 'claude', label: 'Claude', icon: 'creation' },
	{ provider: 'other', label: TranslationKeys.mcp_provider_other, icon: 'dots-horizontal-circle-outline' },
];

const STEPS_BY_PROVIDER: Record<McpProvider, McpStep[]> = {
	claude: [
		{ textKey: TranslationKeys.mcp_claude_step_open_connectors },
		{ textKey: TranslationKeys.mcp_claude_step_add_custom },
		{ textKey: TranslationKeys.mcp_claude_step_name, copy: 'appName' },
		{ textKey: TranslationKeys.mcp_claude_step_url, copy: 'serverUrl' },
		{ textKey: TranslationKeys.mcp_claude_step_continue },
		{ textKey: TranslationKeys.mcp_claude_step_authentication },
		{ textKey: TranslationKeys.mcp_claude_step_header, copy: 'authorizationHeader' },
		{ textKey: TranslationKeys.mcp_claude_step_finish },
	],
	openai: [
		{ textKey: TranslationKeys.mcp_openai_step_open_settings },
		{ textKey: TranslationKeys.mcp_openai_step_plugins },
		{ textKey: TranslationKeys.mcp_openai_step_add },
		{ textKey: TranslationKeys.mcp_openai_step_name, copy: 'appName' },
		{ textKey: TranslationKeys.mcp_openai_step_url, copy: 'serverUrlWithToken' },
		{ textKey: TranslationKeys.mcp_openai_step_authentication },
		{ textKey: TranslationKeys.mcp_openai_step_use },
	],
	other: [
		{ textKey: TranslationKeys.mcp_other_step_url, copy: 'serverUrl' },
		{ textKey: TranslationKeys.mcp_other_step_header, copy: 'authorizationHeader' },
		{ textKey: TranslationKeys.mcp_other_step_url_with_token, copy: 'serverUrlWithToken' },
	],
};

const COPY_VALUE_LABELS: Record<CopyValueKind, TranslationKeys> = {
	appName: TranslationKeys.mcp_app_name,
	serverUrl: TranslationKeys.mcp_server_url,
	authorizationHeader: TranslationKeys.mcp_authorization_header_value,
	serverUrlWithToken: TranslationKeys.mcp_server_url_with_token,
};

async function readTokenResponse(response: Response): Promise<string> {
	if (!response.ok) {
		throw new Error('MCP token request failed with status ' + response.status);
	}
	const body: unknown = await response.json();
	if (!McpAccessHelper.isValidTokenResponse(body)) {
		throw new Error('MCP token response is invalid');
	}
	return body.token;
}

/** The token of the public MCP user - no login, and on purpose without the user's own token. */
async function fetchPublicMcpToken(): Promise<string> {
	return await readTokenResponse(await fetch(Server.ServerUrl + McpAccessHelper.getEndpointPath(McpAccessHelper.ROUTE_PUBLIC_TOKEN)));
}

async function fetchHasPersonalMcpToken(): Promise<boolean> {
	const response = await authorizedFetch(McpAccessHelper.getEndpointPath(McpAccessHelper.ROUTE_MY_TOKEN));
	if (!response.ok) {
		throw new Error('MCP token status request failed with status ' + response.status);
	}
	const body: unknown = await response.json();
	return McpAccessHelper.isValidTokenStatus(body) && body.has_token;
}

/** Returns the user's token, the server creates it on the first call. */
async function fetchOrCreatePersonalMcpToken(): Promise<string> {
	return await readTokenResponse(await authorizedFetch(McpAccessHelper.getEndpointPath(McpAccessHelper.ROUTE_MY_TOKEN), { method: 'POST' }));
}

const McpInstruction = () => {
	useSetPageTitle(TranslationKeys.mcp_instruction);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const toast = useToast();
	const customerConfig = useCustomerConfig();
	const { serverInfo, primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const { loggedIn, user } = useAppSelector((state) => state.authReducer);
	// Anonymous users ("continue without account") have no Directus user and thus no own token.
	const hasPersonalAccess = loggedIn && UserHelper.isRegisteredUser(user);

	const [provider, setProvider] = useState<McpProvider | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [hasPersonalToken, setHasPersonalToken] = useState<boolean | null>(null);
	const [isLoadingToken, setIsLoadingToken] = useState(false);

	const appName = ServerInfoHelper.getServerName(serverInfo || {}, customerConfig);
	const serverUrl = McpAccessHelper.buildServerUrl(Server.ServerUrl);

	useEffect(() => {
		let cancelled = false;
		setToken(null);
		setHasPersonalToken(null);
		const load = async () => {
			try {
				if (hasPersonalAccess) {
					const hasToken = await fetchHasPersonalMcpToken();
					if (!cancelled) setHasPersonalToken(hasToken);
				} else {
					const publicToken = await fetchPublicMcpToken();
					if (!cancelled) setToken(publicToken);
				}
			} catch (error) {
				console.error('Could not load the MCP token:', error);
				if (!cancelled) toast(translate(TranslationKeys.mcp_access_token_load_failed), 'error');
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [hasPersonalAccess]);

	const revealPersonalToken = useCallback(async () => {
		setIsLoadingToken(true);
		try {
			setToken(await fetchOrCreatePersonalMcpToken());
			setHasPersonalToken(true);
		} catch (error) {
			console.error('Could not create the MCP token:', error);
			toast(translate(TranslationKeys.mcp_access_token_load_failed), 'error');
		} finally {
			setIsLoadingToken(false);
		}
	}, [toast, translate]);

	const copyToClipboard = useCallback(
		async (value: string) => {
			await Clipboard.setStringAsync(value);
			toast(translate(TranslationKeys.copied), 'success');
		},
		[toast, translate]
	);

	const getCopyValue = (kind: CopyValueKind): string | null => {
		switch (kind) {
			case 'appName':
				return appName;
			case 'serverUrl':
				return serverUrl;
			case 'authorizationHeader':
				return token ? McpAccessHelper.buildAuthorizationHeaderValue(token) : null;
			case 'serverUrlWithToken':
				return token ? McpAccessHelper.buildServerUrlWithToken(Server.ServerUrl, token) : null;
		}
	};

	const renderCopyRow = (label: string, value: string | null, groupPosition: 'top' | 'middle' | 'bottom' | 'single' = 'single') => (
		<SettingsList
			title={label}
			value={value ?? translate(TranslationKeys.mcp_access_token_required)}
			valueColor={value ? undefined : theme.modal.placeholder}
			stackedValue
			leftIcon={<MaterialCommunityIcons name={value ? 'content-copy' : 'key-outline'} size={22} color={theme.screen.icon} />}
			handleFunction={value ? () => void copyToClipboard(value) : undefined}
			groupPosition={groupPosition}
		/>
	);

	const renderTokenSection = () => {
		if (!hasPersonalAccess) {
			return (
				<>
					<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_public_hint)} />
					{token ? renderCopyRow(translate(TranslationKeys.mcp_access_token), token) : <ActivityIndicator color={theme.screen.text} />}
				</>
			);
		}
		return (
			<>
				<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_personal_hint)} />
				{token ? (
					renderCopyRow(translate(TranslationKeys.mcp_access_token), token)
				) : (
					<SettingsList
						iconBgColor={primaryColor}
						leftIcon={<MaterialCommunityIcons name={hasPersonalToken ? 'eye-outline' : 'key-plus'} size={24} color={theme.screen.icon} />}
						title={translate(hasPersonalToken ? TranslationKeys.mcp_access_token_show : TranslationKeys.mcp_access_token_create)}
						rightIcon={isLoadingToken || hasPersonalToken === null ? <ActivityIndicator color={theme.screen.text} /> : undefined}
						handleFunction={isLoadingToken || hasPersonalToken === null ? undefined : () => void revealPersonalToken()}
						groupPosition="single"
					/>
				)}
			</>
		);
	};

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_instruction_intro)} />

				<SettingsGroupTitle>{translate(TranslationKeys.mcp_choose_provider)}</SettingsGroupTitle>
				<View style={styles.groupContainer}>
					{PROVIDER_OPTIONS.map((option, index) => {
						const isSelected = option.provider === provider;
						const groupPosition = index === 0 ? 'top' : index === PROVIDER_OPTIONS.length - 1 ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={option.provider}
								leftIcon={<MaterialCommunityIcons name={option.icon} size={24} color={theme.screen.icon} />}
								title={option.provider === 'other' ? translate(option.label) : option.label}
								rightIcon={<MaterialCommunityIcons name={isSelected ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={isSelected ? primaryColor : theme.screen.icon} />}
								handleFunction={() => setProvider(option.provider)}
								groupPosition={groupPosition}
							/>
						);
					})}
				</View>

				{provider ? (
					<>
						<SettingsGroupTitle>{translate(TranslationKeys.mcp_access_token)}</SettingsGroupTitle>
						<View style={styles.groupContainer}>{renderTokenSection()}</View>

						<SettingsGroupTitle>{translate(TranslationKeys.mcp_steps_title)}</SettingsGroupTitle>
						<View style={styles.groupContainer}>
							{STEPS_BY_PROVIDER[provider].map((step, index) => (
								<View key={step.textKey} style={styles.step}>
									<View style={styles.stepRow}>
										<View style={[styles.stepNumber, { backgroundColor: primaryColor }]}>
											<Text style={[styles.stepNumberText, { color: contrastColor }]}>{index + 1}</Text>
										</View>
										<View style={styles.stepText}>
											<MyMarkdownProjectColored content={translate(step.textKey)} />
										</View>
									</View>
									{step.copy ? <View style={styles.stepCopy}>{renderCopyRow(translate(COPY_VALUE_LABELS[step.copy]), getCopyValue(step.copy))}</View> : null}
								</View>
							))}
						</View>
					</>
				) : null}
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
	groupContainer: {
		marginBottom: 20,
	},
	step: {
		marginBottom: 14,
	},
	stepRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
	},
	stepNumber: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 2,
	},
	stepNumberText: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 14,
	},
	stepText: {
		flex: 1,
	},
	stepCopy: {
		marginTop: 8,
		marginLeft: 40,
	},
});

export default McpInstruction;
