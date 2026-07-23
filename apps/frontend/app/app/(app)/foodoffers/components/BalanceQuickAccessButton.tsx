import React, { useCallback, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { isWeb } from '@/constants/Constants';
import { AppComponentIds } from '@/constants/ComponentIds';
import { TranslationKeys } from '@/locales/keys';
import IconButton from '@/components/UI/IconButton';
import useAccountBalanceModal from '@/hooks/useAccountBalanceModal';
import useMyCardReader from '@/app/(app)/account-balance/MyCardReader';

interface BalanceQuickAccessButtonProps {
	style?: any;
}

/**
 * Quick-access button for the foodoffers header: opens the account-balance
 * screen in a modal with the NFC scan already running. Only makes sense on
 * native (NFC isn't available on web) and only when the balance feature is
 * enabled for this server. Otherwise it also requires a card to actually be
 * readable (same isNfcSupported/isNfcEnabled check the account-balance screen
 * itself uses to decide whether to show its "read card" button) - unless
 * we're in dev mode, where the button stays visible even without real NFC
 * (e.g. in Expo Go) so the modal's "Simulate X€" debug actions remain
 * reachable to exercise the flow without physical hardware.
 */
const BalanceTriggerButton = ({
	triggerProps,
	onPress,
	style,
	color,
}: {
	triggerProps: object;
	onPress: () => void;
	style?: any;
	color: string;
}) => (
	<IconButton
		{...triggerProps}
		onPress={onPress}
		style={style}
		nativeID={AppComponentIds.FOODOFFERS_BALANCE_QUICK_ACCESS}
	>
		<Octicons name="credit-card" size={24} color={color} />
	</IconButton>
);

// Factory returning a stable `trigger` render-prop for CustomTooltip, so no
// new function-that-returns-JSX is defined inside the parent component body.
function makeBalanceTrigger(onPress: () => void, style: any, color: string) {
	return (triggerProps: object) => (
		<BalanceTriggerButton triggerProps={triggerProps} onPress={onPress} style={style} color={color} />
	);
}

const BalanceQuickAccessButton: React.FC<BalanceQuickAccessButtonProps> = ({ style }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { appSettings } = useAppSelector(state => state.settings);
	const { isDevMode } = useAppSelector(state => state.authReducer);
	const { openAccountBalanceModal } = useAccountBalanceModal();
	const myCardReader = useMyCardReader();
	const [isNfcSupported, setIsNfcSupported] = useState(false);
	const [isNfcEnabled, setIsNfcEnabled] = useState(false);

	const balanceFeatureActive = !isWeb && !!appSettings?.balance_enabled;
	// In dev mode, show the button even without real NFC support (e.g. Expo
	// Go) so the account-balance modal's "Simulate X€" debug actions can be
	// reached to exercise the read/instruction flow without physical NFC.
	const nfcReady = isDevMode || (isNfcSupported && isNfcEnabled);

	useFocusEffect(
		useCallback(() => {
			if (!balanceFeatureActive) return;

			let isCurrent = true;
			const checkNfcStatus = async () => {
				try {
					const nfcAvailable = await myCardReader.isNfcSupported();
					if (isCurrent) setIsNfcSupported(nfcAvailable.result);

					const nfcEnabled = await myCardReader.isNfcEnabled();
					if (isCurrent) setIsNfcEnabled(nfcEnabled.result);
				} catch (error) {
					console.error('Error checking NFC status:', error);
				}
			};

			checkNfcStatus();
			return () => {
				isCurrent = false;
			};
			// myCardReader is intentionally omitted: useMyCardReader() returns a new
			// instance every render (same as account-balance/index.tsx), so including
			// it here would re-trigger this effect (and the NFC check) on every
			// render once setIsNfcSupported/setIsNfcEnabled cause a re-render.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [balanceFeatureActive])
	);

	if (!balanceFeatureActive || !nfcReady) {
		return null;
	}

	return (
		<CustomTooltip
			placement="top"
			trigger={makeBalanceTrigger(() => openAccountBalanceModal(isNfcSupported && isNfcEnabled), style, theme.header.text)}
		>
			<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
				<TooltipText fontSize="$sm" color={theme.tooltip.text}>
					{translate(TranslationKeys.accountbalance)}
				</TooltipText>
			</TooltipContent>
		</CustomTooltip>
	);
};

export default BalanceQuickAccessButton;
