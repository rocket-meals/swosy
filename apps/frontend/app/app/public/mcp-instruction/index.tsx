import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { McpAccessHelper } from 'repo-depkit-common';
import { CollapsibleView } from 'repo-depkit-common-ui';
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
import ClaudeSymbol from '@/assets/icons/brands/claude-symbol.svg';
import OpenAiSymbol from '@/assets/icons/brands/openai-symbol.svg';
import { performLogout } from '@/helper/logoutHelper';

type McpProvider = 'claude' | 'openai' | 'other';

/** Values the steps offer to copy. The token-based ones exist only once a token is loaded. */
type CopyValueKind = 'appName' | 'serverUrl' | 'authorizationHeader' | 'serverUrlWithToken';

type McpStep = {
	textKey: TranslationKeys;
	copy?: CopyValueKind;
};

type ProviderLogoProps = { size: number; color: string };

/**
 * Brand symbols, used exactly as the companies provide them and only to identify their service
 * (OpenAI/Anthropic brand rules) - not recolored, not on our primary color. OpenAI's symbol has no
 * own color: OpenAI offers it in black and in white, so it takes the text color of the theme.
 */
const PROVIDER_OPTIONS: { provider: McpProvider; label: string | TranslationKeys; renderLogo: (props: ProviderLogoProps) => React.ReactNode }[] = [
	// Brand names, not translated.
	{ provider: 'openai', label: 'OpenAI (ChatGPT)', renderLogo: ({ size, color }) => <OpenAiSymbol width={size} height={size} fill={color} /> },
	{ provider: 'claude', label: 'Claude', renderLogo: ({ size }) => <ClaudeSymbol width={size} height={size} /> },
	{
		provider: 'other',
		label: TranslationKeys.mcp_provider_other,
		renderLogo: ({ size, color }) => <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={size} color={color} />,
	},
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

/**
 * Whether the user already has a token. Directus returns a set token concealed (`**********`),
 * so the app can tell that one exists, but never show it again.
 */
async function fetchHasPersonalMcpToken(): Promise<boolean> {
	const response = await authorizedFetch(McpAccessHelper.OWN_TOKEN_PATH);
	if (!response.ok) {
		throw new Error('MCP token status request failed with status ' + response.status);
	}
	return McpAccessHelper.hasTokenInOwnUserResponse(await response.json());
}

/**
 * Sets a new token for the user: a random string from Directus, saved on the user's own
 * `directus_users` entry (the `User` policy may write `token`). Replaces an existing token.
 */
async function createPersonalMcpToken(): Promise<string> {
	const randomResponse = await authorizedFetch(McpAccessHelper.buildRandomStringPath());
	if (!randomResponse.ok) {
		throw new Error('Random string request failed with status ' + randomResponse.status);
	}
	const token = McpAccessHelper.parseRandomStringResponse(await randomResponse.json());
	if (!token) {
		throw new Error('Random string response is invalid');
	}
	const saveResponse = await authorizedFetch(McpAccessHelper.OWN_TOKEN_PATH, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token }),
	});
	if (!saveResponse.ok) {
		throw new Error('Saving the MCP token failed with status ' + saveResponse.status);
	}
	return token;
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
	// A section folds itself away once something is picked in it (a preselected assistant starts
	// folded) and can be opened again by hand. Without a pick it always stays open.
	const [isProviderSectionCollapsed, setIsProviderSectionCollapsed] = useState(() => parseAssistantParam(assistantParam) !== null);
	const [isAccountSectionCollapsed, setIsAccountSectionCollapsed] = useState(false);
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
			setIsProviderSectionCollapsed(true);
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
		setIsProviderSectionCollapsed(true);
		// Keeps the choice in the url, so the page can be shared or bookmarked as it is.
		router.setParams({ [ASSISTANT_PARAM]: selected, [LEGACY_ASSISTANT_PARAM]: undefined });
	};

	// Brand names stay as they are, only "Andere" is translated.
	const getProviderLabel = (option: (typeof PROVIDER_OPTIONS)[number]) => (option.provider === 'other' ? translate(option.label) : option.label);

	const selectAccessMode = (selected: McpAccessMode) => {
		setAccessMode(selected);
		setIsAccountSectionCollapsed(true);
	};

	/** Opens the support form with the step already named in the title, so a ticket says where it got stuck. */
	const openSupportForStep = (stepNumber: number) => {
		const providerOption = PROVIDER_OPTIONS.find((option) => option.provider === provider);
		const providerLabel = providerOption ? getProviderLabel(providerOption) : '';
		const title = `${translate(TranslationKeys.mcp_instruction)} – ${providerLabel} – ${translate(TranslationKeys.mcp_step)} ${stepNumber}`;
		router.push({ pathname: '/feedback-support', params: { title } });
	};

	const openLogin = () => {
		if (loggedIn) {
			// Anonymous users are "logged in" without an account - same way to the login screen as the popup events take.
			void performLogout(dispatch, router);
		} else {
			router.push('/(auth)/login');
		}
	};

	const createPersonalToken = useCallback(async () => {
		setIsLoadingToken(true);
		try {
			setPersonalToken(await createPersonalMcpToken());
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

	const renderSectionHeader = (title: string, value: string | undefined, leftIcon: React.ReactNode, isCollapsed: boolean, toggle: () => void) => (
		<SettingsList
			iconBgColor="transparent"
			leftIcon={leftIcon}
			title={title}
			value={value}
			stackedValue
			rightIcon={<MaterialCommunityIcons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={26} color={theme.screen.icon} />}
			handleFunction={toggle}
			groupPosition="single"
		/>
	);

	const selectedProviderOption = PROVIDER_OPTIONS.find((option) => option.provider === provider);
	const accessModeLabels: Record<McpAccessMode, string> = {
		personal: translate(TranslationKeys.mcp_connect_with_account),
		public: translate(TranslationKeys.mcp_continue_without_account),
	};
	const accessModeIcons: Record<McpAccessMode, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
		personal: 'account-key',
		public: 'earth',
	};
	const isProviderCollapsed = isProviderSectionCollapsed && provider !== null;
	const isAccountCollapsed = isAccountSectionCollapsed && accessMode !== null;

	const renderAccessChoice = () => (
		<>
			<MyMarkdownProjectColored content={translate(hasAccount ? TranslationKeys.mcp_access_choice_question : TranslationKeys.mcp_access_no_account_hint)} />
			<View style={styles.choiceGroup}>
				{hasAccount ? (
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="account-key" size={24} color={theme.screen.icon} />}
						title={translate(TranslationKeys.mcp_connect_with_account)}
						rightIcon={renderRadioIcon(accessMode === 'personal')}
						handleFunction={() => selectAccessMode('personal')}
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
					handleFunction={() => selectAccessMode('public')}
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
						<>
							{hasPersonalToken ? <MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_exists_hint)} /> : null}
							<SettingsList
								iconBgColor={primaryColor}
								leftIcon={<MaterialCommunityIcons name={hasPersonalToken ? 'key-change' : 'key-plus'} size={24} color={theme.screen.icon} />}
								title={translate(hasPersonalToken ? TranslationKeys.mcp_access_token_regenerate : TranslationKeys.mcp_access_token_create)}
								rightIcon={isLoadingToken || hasPersonalToken === null ? <ActivityIndicator color={theme.screen.text} /> : undefined}
								handleFunction={isLoadingToken || hasPersonalToken === null ? undefined : () => void createPersonalToken()}
								groupPosition="single"
							/>
						</>
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

				<View style={styles.groupContainer}>
					{renderSectionHeader(
						translate(TranslationKeys.mcp_provider),
						selectedProviderOption ? getProviderLabel(selectedProviderOption) : undefined,
						selectedProviderOption ? (
							selectedProviderOption.renderLogo({ size: 24, color: theme.screen.text })
						) : (
							<MaterialCommunityIcons name="robot-outline" size={24} color={theme.screen.text} />
						),
						isProviderCollapsed,
						() => setIsProviderSectionCollapsed(!isProviderCollapsed)
					)}
					<CollapsibleView collapsed={isProviderCollapsed}>
						<View style={styles.sectionContent}>
							<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_choose_provider)} />
							<View style={styles.choiceGroup}>
								{PROVIDER_OPTIONS.map((option, index) => {
									const groupPosition = index === 0 ? 'top' : index === PROVIDER_OPTIONS.length - 1 ? 'bottom' : 'middle';
									return (
										<SettingsList
											key={option.provider}
											iconBgColor="transparent"
											leftIcon={option.renderLogo({ size: 24, color: theme.screen.text })}
											title={getProviderLabel(option)}
											rightIcon={renderRadioIcon(option.provider === provider)}
											handleFunction={() => selectProvider(option.provider)}
											groupPosition={groupPosition}
										/>
									);
								})}
							</View>
						</View>
					</CollapsibleView>
				</View>

				{provider ? (
					<View style={styles.groupContainer}>
						{renderSectionHeader(
							translate(TranslationKeys.mcp_account),
							accessMode ? accessModeLabels[accessMode] : undefined,
							<MaterialCommunityIcons name={accessMode ? accessModeIcons[accessMode] : 'account-question-outline'} size={24} color={theme.screen.text} />,
							isAccountCollapsed,
							() => setIsAccountSectionCollapsed(!isAccountCollapsed)
						)}
						<CollapsibleView collapsed={isAccountCollapsed}>
							<View style={styles.sectionContent}>{renderAccessChoice()}</View>
						</CollapsibleView>
						{accessMode ? <View style={styles.sectionContent}>{renderToken()}</View> : null}
					</View>
				) : null}

				{provider && accessMode ? (
					<>
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
									<TouchableOpacity style={styles.stepProblems} onPress={() => openSupportForStep(index + 1)} accessibilityRole="link">
										<MaterialCommunityIcons name="lifebuoy" size={16} color={theme.modal.placeholder} />
										<Text style={[styles.stepProblemsText, { color: theme.modal.placeholder }]}>{translate(TranslationKeys.mcp_step_problems)}</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>
					</>
				) : null}

				<Text style={[styles.trademarkNotice, { color: theme.modal.placeholder }]}>{translate(TranslationKeys.mcp_trademark_notice)}</Text>
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
	sectionContent: {
		paddingTop: 12,
	},
	stepProblems: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 8,
		marginLeft: 40,
		alignSelf: 'flex-start',
		paddingVertical: 4,
	},
	stepProblemsText: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
		textDecorationLine: 'underline',
	},
	trademarkNotice: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		marginTop: 10,
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
