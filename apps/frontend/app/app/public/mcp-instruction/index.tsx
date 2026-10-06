import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import ProjectButton from '@/components/ProjectButton';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { ServerInfoHelper } from '@/helper/ServerInfoHelper';
import { UserHelper } from '@/helper/UserHelper';
import { authorizedFetch } from '@/helper/authorizedFetch';
import { myContrastColor } from '@/helper/ColorHelper';
import Server from '@/constants/ServerUrl';
import ClaudeSymbol from '@/assets/icons/brands/claude-symbol.svg';
import OpenAiSymbol from '@/assets/icons/brands/openai-symbol.svg';
import { performLogout } from '@/helper/logoutHelper';

type McpProvider = 'claude' | 'openai' | 'other';

/** Values the steps offer to copy. The token-based ones exist only once a token (or its placeholder) is known. */
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

/** Saves `token` on the user's own `directus_users` entry (the `User` policy may write `token`); `null` revokes it. */
async function saveOwnMcpToken(token: string | null): Promise<void> {
	const response = await authorizedFetch(McpAccessHelper.OWN_TOKEN_PATH, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token }),
	});
	if (!response.ok) {
		throw new Error('Saving the MCP token failed with status ' + response.status);
	}
}

/** Sets a new token for the user: a random string from Directus. Replaces an existing token. */
async function createPersonalMcpToken(): Promise<string> {
	const randomResponse = await authorizedFetch(McpAccessHelper.buildRandomStringPath());
	if (!randomResponse.ok) {
		throw new Error('Random string request failed with status ' + randomResponse.status);
	}
	const token = McpAccessHelper.parseRandomStringResponse(await randomResponse.json());
	if (!token) {
		throw new Error('Random string response is invalid');
	}
	await saveOwnMcpToken(token);
	return token;
}

/**
 * Asks the server to make sure the public MCP user exists and returns its current token. No login
 * needed - the token is public anyway.
 */
async function ensurePublicMcpUser(): Promise<string> {
	const response = await fetch(Server.ServerUrl + McpAccessHelper.buildPublicUserPath(), { method: 'POST' });
	if (!response.ok) {
		throw new Error('Public MCP user request failed with status ' + response.status);
	}
	const token = McpAccessHelper.parsePublicUserResponse(await response.json());
	if (!token) {
		throw new Error('Public MCP user response is invalid');
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
	return value.match(/.{1,16}/g)?.join('​') ?? value;
}

const McpInstruction = () => {
	useSetPageTitle(TranslationKeys.mcp_instruction);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const toast = useToast();
	const router = useRouter();
	const dispatch = useDispatch();
	const customerConfig = useCustomerConfig();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
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
	// Only set right after it was created - Directus never shows a saved token again.
	const [personalToken, setPersonalToken] = useState<string | null>(null);
	const [hasPersonalToken, setHasPersonalToken] = useState<boolean | null>(null);
	// The user still knows the saved token: the steps show `<TOKEN>` where it belongs.
	const [usesKnownToken, setUsesKnownToken] = useState(false);
	const [isLoadingToken, setIsLoadingToken] = useState(false);
	// The fixed token is the same on every server; the server is still asked, in case it changed.
	const [publicToken, setPublicToken] = useState<string>(McpAccessHelper.PUBLIC_USER_TOKEN);
	const hasEnsuredPublicUser = useRef(false);

	const appName = ServerInfoHelper.getServerName(serverInfo || {}, customerConfig);
	const serverUrl = McpAccessHelper.buildServerUrl(Server.ServerUrl);
	let token: string | null = null;
	if (accessMode === 'public') {
		token = publicToken;
	} else if (accessMode === 'personal') {
		token = personalToken ?? (usesKnownToken ? McpAccessHelper.TOKEN_PLACEHOLDER : null);
	}
	const isTokenPlaceholder = accessMode === 'personal' && !personalToken && usesKnownToken;

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
		setUsesKnownToken(false);
		setAccessMode((current) => (current === 'personal' ? null : current));
	}, [hasAccount, user?.id]);

	// Choosing the account creates and saves a token right away - unless there already is one,
	// then the user is asked whether they still know it.
	useEffect(() => {
		if (accessMode !== 'personal' || !hasAccount || personalToken || usesKnownToken) {
			return;
		}
		let cancelled = false;
		const load = async () => {
			try {
				const hasToken = await fetchHasPersonalMcpToken();
				if (cancelled) return;
				setHasPersonalToken(hasToken);
				if (!hasToken) {
					setIsLoadingToken(true);
					const createdToken = await createPersonalMcpToken();
					if (cancelled) return;
					setPersonalToken(createdToken);
					setHasPersonalToken(true);
				}
			} catch (error) {
				console.error('Could not load the MCP token:', error);
				if (!cancelled) toast(translate(TranslationKeys.mcp_access_token_load_failed), 'error');
			} finally {
				if (!cancelled) setIsLoadingToken(false);
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
		// Runs on the choice only - not again once the token is there.
	}, [accessMode, hasAccount]);

	// Without an account the server makes sure the public MCP user exists and names its token.
	useEffect(() => {
		if (accessMode !== 'public' || hasEnsuredPublicUser.current) {
			return;
		}
		hasEnsuredPublicUser.current = true;
		ensurePublicMcpUser()
			.then(setPublicToken)
			.catch((error) => {
				// The fixed token from McpAccessHelper stays in place - it is right on every up-to-date server.
				console.error('Could not ensure the public MCP user:', error);
			});
	}, [accessMode]);

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

	/** Opens the support form with the assistant already named in the title, so a ticket says where it got stuck. */
	const openSupport = () => {
		const providerOption = PROVIDER_OPTIONS.find((option) => option.provider === provider);
		const providerLabel = providerOption ? getProviderLabel(providerOption) : '';
		const title = `${translate(TranslationKeys.mcp_instruction)} – ${providerLabel}`;
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
			setUsesKnownToken(false);
		} catch (error) {
			console.error('Could not create the MCP token:', error);
			toast(translate(TranslationKeys.mcp_access_token_load_failed), 'error');
		} finally {
			setIsLoadingToken(false);
		}
	}, [toast, translate]);

	const revokePersonalToken = useCallback(async () => {
		closeModal();
		setIsLoadingToken(true);
		try {
			await saveOwnMcpToken(null);
			setPersonalToken(null);
			setHasPersonalToken(false);
			setUsesKnownToken(false);
			// Without a token the steps are gone - the account choice opens again for a new start.
			setAccessMode(null);
			setIsAccountSectionCollapsed(false);
			toast(translate(TranslationKeys.mcp_access_token_revoked), 'success');
		} catch (error) {
			console.error('Could not revoke the MCP token:', error);
			toast(translate(TranslationKeys.mcp_access_token_revoke_failed), 'error');
		} finally {
			setIsLoadingToken(false);
		}
	}, [closeModal, toast, translate]);

	const confirmRevokePersonalToken = () => {
		showModal({
			title: translate(TranslationKeys.mcp_access_token_revoke),
			children: (
				<View style={styles.modalContent}>
					<Text style={[styles.modalText, { color: theme.screen.text }]}>{translate(TranslationKeys.mcp_access_token_revoke_confirm)}</Text>
					<ProjectButton text={translate(TranslationKeys.mcp_access_token_revoke)} onPress={() => void revokePersonalToken()} style={styles.modalButton} />
					<TouchableOpacity onPress={closeModal} style={styles.modalCancel}>
						<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.cancel)}</Text>
					</TouchableOpacity>
				</View>
			),
		});
	};

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

	/** Just the value and a copy icon on the right - the step text above already says what it is for. */
	const renderCopyRow = (value: string, showTapHint: boolean) => (
		<>
			<SettingsList
				title={makeWrappable(value)}
				noIconIndent
				rightIcon={<MaterialCommunityIcons name="content-copy" size={22} color={theme.screen.icon} />}
				handleFunction={() => void copyToClipboard(value)}
				groupPosition="single"
			/>
			{showTapHint ? <Text style={[styles.tapHint, { color: theme.modal.placeholder }]}>{translate(TranslationKeys.mcp_tap_to_copy)}</Text> : null}
		</>
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

	/** With the account chosen: a spinner while the token is checked or created, or the question whether the saved one is still known. */
	const renderPersonalTokenState = () => {
		if (accessMode !== 'personal' || personalToken) {
			return null;
		}
		if (hasPersonalToken === null || (isLoadingToken && !hasPersonalToken)) {
			return (
				<View style={styles.sectionContent}>
					<ActivityIndicator color={theme.screen.text} />
				</View>
			);
		}
		if (!hasPersonalToken) {
			return null;
		}
		return (
			<View style={styles.sectionContent}>
				<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_exists_hint)} />
				<View style={styles.choiceGroup}>
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="key-outline" size={24} color={theme.screen.icon} />}
						title={translate(TranslationKeys.mcp_access_token_known_yes)}
						rightIcon={renderRadioIcon(usesKnownToken)}
						handleFunction={() => setUsesKnownToken(true)}
						groupPosition="top"
					/>
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="key-change" size={24} color={theme.screen.icon} />}
						title={translate(TranslationKeys.mcp_access_token_known_no)}
						rightIcon={isLoadingToken ? <ActivityIndicator color={theme.screen.text} /> : renderRadioIcon(false)}
						handleFunction={isLoadingToken ? undefined : () => void createPersonalToken()}
						groupPosition="bottom"
					/>
				</View>
			</View>
		);
	};

	const renderSteps = () => {
		if (!provider || token === null) {
			return null;
		}
		const firstCopyIndex = STEPS_BY_PROVIDER[provider].findIndex((step) => step.copy);
		return (
			<>
				<SettingsGroupTitle>{translate(TranslationKeys.mcp_steps_title)}</SettingsGroupTitle>
				{isTokenPlaceholder ? (
					<View style={styles.placeholderHint}>
						<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_placeholder_hint)} />
					</View>
				) : null}
				<View style={styles.groupContainer}>
					{STEPS_BY_PROVIDER[provider].map((step, index) => {
						const copyValue = step.copy ? getCopyValue(step.copy) : null;
						return (
							<View key={step.textKey} style={styles.step}>
								<View style={styles.stepRow}>
									<View style={[styles.stepNumber, { backgroundColor: primaryColor }]}>
										<Text style={[styles.stepNumberText, { color: contrastColor }]}>{index + 1}</Text>
									</View>
									<View style={styles.stepText}>
										<MyMarkdownProjectColored content={translate(step.textKey)} />
									</View>
								</View>
								{copyValue ? <View style={styles.stepCopy}>{renderCopyRow(copyValue, index === firstCopyIndex)}</View> : null}
							</View>
						);
					})}
					<TouchableOpacity style={styles.support} onPress={openSupport} accessibilityRole="link">
						<MaterialCommunityIcons name="lifebuoy" size={16} color={theme.modal.placeholder} />
						<Text style={[styles.supportText, { color: theme.modal.placeholder }]}>{translate(TranslationKeys.mcp_step_problems)}</Text>
					</TouchableOpacity>
				</View>
			</>
		);
	};

	/** The personal token, shown once after creating it, and the way to revoke it. Nothing for the public token. */
	const renderPersonalTokenManagement = () => {
		if (accessMode !== 'personal' || !hasPersonalToken) {
			return null;
		}
		return (
			<>
				<SettingsGroupTitle>{translate(TranslationKeys.mcp_access_token)}</SettingsGroupTitle>
				<View style={styles.groupContainer}>
					{personalToken ? (
						<>
							<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_personal_hint)} />
							<View style={styles.tokenCopy}>{renderCopyRow(personalToken, false)}</View>
						</>
					) : (
						<MyMarkdownProjectColored content={translate(TranslationKeys.mcp_access_token_unknown_hint)} />
					)}
					<View style={styles.tokenCopy}>
						<SettingsList
							leftIcon={<MaterialCommunityIcons name="key-remove" size={24} color={theme.screen.icon} />}
							title={translate(TranslationKeys.mcp_access_token_revoke)}
							rightIcon={isLoadingToken ? <ActivityIndicator color={theme.screen.text} /> : undefined}
							handleFunction={isLoadingToken ? undefined : confirmRevokePersonalToken}
							groupPosition="single"
						/>
					</View>
				</View>
			</>
		);
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
						{renderPersonalTokenState()}
					</View>
				) : null}

				{renderSteps()}

				{renderPersonalTokenManagement()}

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
	placeholderHint: {
		marginBottom: 12,
	},
	support: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginTop: 4,
		alignSelf: 'flex-start',
		paddingVertical: 4,
	},
	supportText: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
		textDecorationLine: 'underline',
	},
	tapHint: {
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		marginTop: 4,
		marginLeft: 4,
	},
	tokenCopy: {
		marginTop: 8,
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
	modalContent: {
		gap: 12,
	},
	modalText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	modalButton: {
		marginVertical: 0,
	},
	modalCancel: {
		alignSelf: 'center',
		paddingVertical: 6,
	},
});

export default McpInstruction;
