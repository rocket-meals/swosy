import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
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
import { performLogout } from '@/helper/logoutHelper';

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

/** `?assistant=claude` preselects the assistant, so a link can lead straight to its steps. */
const ASSISTANT_PARAM = 'assistant';
/** Former name of `assistant` - still read, so links shared with it keep working. */
const LEGACY_ASSISTANT_PARAM = 'ai-agent';

const ASSISTANT_PARAM_VALUES: Record<string, McpProvider> = {
	claude: 'claude',
	openai: 'openai',
	chatgpt: 'openai',
	other: 'other',
};

function parseAssistantParam(value: string | string[] | undefined): McpProvider | null {
	const raw = Array.isArray(value) ? value[0] : value;
	return raw ? (ASSISTANT_PARAM_VALUES[raw.trim().toLowerCase()] ?? null) : null;
}

/** Whether the AI assistant connects with the user's own account or with the public MCP user. */
type McpAccessMode = 'personal' | 'public';

/** Tokens have no spaces - zero-width spaces let a long one wrap inside its row. Display only, the copy keeps the raw value. */
function makeWrappable(value: string): string {
	return value.match(/.{1,16}/g)?.join('\u200B') ?? value;
}

const McpInstruction = () => {
	useSetPageTitle(TranslationKeys.mcp_instruction);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const toast = useToast();
	const router = useRouter();
	const dispatch = useDispatch();
	const customerConfig = useCustomerConfig();
	const { serverInfo, primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const contrastColor = myContrastColor(primaryColor, theme, mode === 'dark');
	const { loggedIn, user } = useAppSelector((state) => state.authReducer);
	// Anonymous users ("continue without account") have no Directus user and thus no own token.
	const hasAccount = loggedIn && UserHelper.isRegisteredUser(user);

	const { [ASSISTANT_PARAM]: assistantParamValue, [LEGACY_ASSISTANT_PARAM]: legacyAssistantParamValue } = useLocalSearchParams();
	const assistantParam = assistantParamValue ?? legacyAssistantParamValue;
	const [provider, setProvider] = useState<McpProvider | null>(() => parseAssistantParam(assistantParam));
	const [accessMode, setAccessMode] = useState<McpAccessMode | null>(null);
	const [personalToken, setPersonalToken] = useState<string | null>(null);
	const [hasPersonalToken, setHasPersonalToken] = useState<boolean | null>(null);
	const [isLoadingToken, setIsLoadingToken] = useState(false);

	const appName = ServerInfoHelper.getServerName(serverInfo || {}, customerConfig);
	const serverUrl = McpAccessHelper.buildServerUrl(Server.ServerUrl);
	// The public MCP user has the same fixed token on every server - nothing to ask the server for.
	const token = accessMode === 'public' ? McpAccessHelper.PUBLIC_USER_TOKEN : accessMode === 'personal' ? personalToken : null;

	useEffect(() => {
		const providerFromParam = parseAssistantParam(assistantParam);
		if (providerFromParam) {
			setProvider(providerFromParam);
		}
	}, [assistantParam]);

	// Logging out (or in as someone else) must not leave the previous user's token on screen.
	useEffect(() => {
		setPersonalToken(null);
		setHasPersonalToken(null);
		setAccessMode((current) => (current === 'personal' ? null : current));
	}, [hasAccount, user?.id]);

	useEffect(() => {
		if (accessMode !== 'personal' || !hasAccount) {
			return;
		}
		let cancelled = false;
		const load = async () => {
			try {
				const hasToken = await fetchHasPersonalMcpToken();
				if (!cancelled) setHasPersonalToken(hasToken);
			} catch (error) {
				console.error('Could not load the MCP token:', error);
				if (!cancelled) toast(translate(TranslationKeys.mcp_access_token_load_failed), 'error');
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [accessMode, hasAccount]);

	const selectProvider = (selected: McpProvider) => {
		setProvider(selected);
		// Keeps the choice in the url, so the page can be shared or bookmarked as it is.
		router.setParams({ [ASSISTANT_PARAM]: selected, [LEGACY_ASSISTANT_PARAM]: undefined });
	};

	const openLogin = () => {
		if (loggedIn) {
			// Anonymous users are "logged in" without an account - same way to the login screen as the popup events take.
			void performLogout(dispatch, router);
		} else {
			router.push('/(auth)/login');
		}
	};

	const revealPersonalToken = useCallback(async () => {
		setIsLoadingToken(true);
		try {
			setPersonalToken(await fetchOrCreatePersonalMcpToken());
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
			value={value ? makeWrappable(value) : translate(TranslationKeys.mcp_access_token_required)}
			valueColor={value ? undefined : theme.modal.placeholder}
			stackedValue
			leftIcon={<MaterialCommunityIcons name={value ? 'content-copy' : 'key-outline'} size={22} color={theme.screen.icon} />}
			handleFunction={value ? () => void copyToClipboard(value) : undefined}
			groupPosition={groupPosition}
		/>
	);

	const renderRadioIcon = (isSelected: boolean) => (
		<MaterialCommunityIcons name={isSelected ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={isSelected ? primaryColor : theme.screen.icon} />
	);

	const renderAccessChoice = () => (
		<>
			<MyMarkdownProjectColored content={translate(hasAccount ? TranslationKeys.mcp_access_choice_question : TranslationKeys.mcp_access_no_account_hint)} />
			<View style={styles.choiceGroup}>
				{hasAccount ? (
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="account-key" size={24} color={theme.screen.icon} />}
						title={translate(TranslationKeys.mcp_connect_with_account)}
						rightIcon={renderRadioIcon(accessMode === 'personal')}
						handleFunction={() => setAccessMode('personal')}
						groupPosition="top"
					/>
				) : (
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="login" size={24} color={theme.screen.icon} />}
						title={`${translate(TranslationKeys.sign_in)} / ${translate(TranslationKeys.create_account)}`}
						rightIcon={<Octicons name="chevron-right" size={24} color={theme.screen.icon} />}
						handleFunction={openLogin}
						groupPosition="top"
					/>
				)}
				<SettingsList
					leftIcon={<MaterialCommunityIcons name="earth" size={24} color={theme.screen.icon} />}
					title={translate(TranslationKeys.mcp_continue_without_account)}
					rightIcon={renderRadioIcon(accessMode === 'public')}
					handleFunction={() => setAccessMode('public')}
					groupPosition="bottom"
				/>
			</View>
		</>
	);

	const renderToken = () => {
		if (accessMode === 'public') {
			return (
				<>
					<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_public_hint)} />
					{renderCopyRow(translate(TranslationKeys.mcp_access_token), McpAccessHelper.PUBLIC_USER_TOKEN)}
				</>
			);
		}
		if (accessMode === 'personal') {
			return (
				<>
					<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_personal_hint)} />
					{personalToken ? (
						renderCopyRow(translate(TranslationKeys.mcp_access_token), personalToken)
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
		}
		return null;
	};

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_instruction_intro)} />

				<SettingsGroupTitle>{translate(TranslationKeys.mcp_choose_provider)}</SettingsGroupTitle>
				<View style={styles.groupContainer}>
					{PROVIDER_OPTIONS.map((option, index) => {
						const groupPosition = index === 0 ? 'top' : index === PROVIDER_OPTIONS.length - 1 ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={option.provider}
								leftIcon={<MaterialCommunityIcons name={option.icon} size={24} color={theme.screen.icon} />}
								title={option.provider === 'other' ? translate(option.label) : option.label}
								rightIcon={renderRadioIcon(option.provider === provider)}
								handleFunction={() => selectProvider(option.provider)}
								groupPosition={groupPosition}
							/>
						);
					})}
				</View>

				{provider ? (
					<>
						<SettingsGroupTitle>{translate(TranslationKeys.mcp_access_token)}</SettingsGroupTitle>
						<View style={styles.groupContainer}>
							{renderAccessChoice()}
							{renderToken()}
						</View>

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
	choiceGroup: {
		marginBottom: 12,
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
