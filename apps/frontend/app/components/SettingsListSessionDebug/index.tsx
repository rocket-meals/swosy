import React, { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsList from '@/components/SettingsList';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { SessionDiagnostics } from '@/helper/authSessionHelper';
import { useLanguage } from '@/hooks/useLanguage';
import useToast from '@/hooks/useToast';
import { TranslationKeys } from '@/locales/keys';

type SettingsListSessionDebugProps = {
	iconBgColor: string;
	iconColor: string;
};

/**
 * Debug rows to reproduce the login-session cases behind the feedback "Essgewohnheiten setzen
 * sich immer zurück": show the session state, let the access token expire (the moment a refresh
 * is needed - try it in airplane mode, the session must survive) and invalidate the refresh token
 * (the server rejects it - the login hint must appear, guests are signed in again silently).
 */
export default function SettingsListSessionDebug({ iconBgColor, iconColor }: Readonly<SettingsListSessionDebugProps>) {
	const { translate } = useLanguage();
	const toast = useToast();
	const [session, setSession] = useState<SessionDiagnostics | null>(null);

	const refreshSession = useCallback(async () => {
		setSession(await ServerAPI.getSessionDiagnostics());
	}, []);

	useEffect(() => {
		refreshSession();
	}, [refreshSession]);

	// Sends a request right away so the effect of the button is visible immediately.
	const checkWithServer = useCallback(async () => {
		const result = await ServerAPI.validateSession();
		await refreshSession();
		if (result.status === 'valid') {
			toast(translate(TranslationKeys.debug_session_valid), 'success');
		} else if (result.status === 'invalid') {
			toast(translate(TranslationKeys.debug_session_rejected), 'error');
		} else {
			toast(translate(TranslationKeys.debug_session_server_unreachable), 'info');
		}
	}, [refreshSession, toast, translate]);

	const runDebugAction = useCallback(
		async (action: () => Promise<boolean>) => {
			if (!(await action())) {
				toast(translate(TranslationKeys.debug_session_none), 'error');
				return;
			}
			await checkWithServer();
		},
		[checkWithServer, toast, translate]
	);

	const handleExpireAccessToken = useCallback(() => runDebugAction(() => ServerAPI.debugExpireAccessToken()), [runDebugAction]);
	const handleInvalidateRefreshToken = useCallback(() => runDebugAction(() => ServerAPI.debugInvalidateRefreshToken()), [runDebugAction]);

	// Non-verbal status: refresh token present, access token valid until.
	const expiresAt = session?.accessTokenExpiresAt ? new Date(session.accessTokenExpiresAt).toLocaleTimeString() : '–';
	const sessionValue = session ? `${session.hasRefreshToken ? '✓' : '✗'} · ${expiresAt}${session.accessTokenExpired ? ' ✗' : ''}` : '–';

	return (
		<>
			<SettingsList
				iconBgColor={iconBgColor}
				leftIcon={<MaterialCommunityIcons name="key-chain-variant" size={24} color={iconColor} />}
				label={translate(TranslationKeys.debug_session_status)}
				value={sessionValue}
				handleFunction={checkWithServer}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={iconBgColor}
				leftIcon={<MaterialCommunityIcons name="timer-sand-complete" size={24} color={iconColor} />}
				label={translate(TranslationKeys.debug_expire_access_token)}
				value=""
				handleFunction={handleExpireAccessToken}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor={iconBgColor}
				leftIcon={<MaterialCommunityIcons name="key-remove" size={24} color={iconColor} />}
				label={translate(TranslationKeys.debug_invalidate_refresh_token)}
				value=""
				handleFunction={handleInvalidateRefreshToken}
				groupPosition="bottom"
			/>
		</>
	);
}
