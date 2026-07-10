import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { isWeb } from '@/constants/Constants';
import { AppComponentIds } from '@/constants/ComponentIds';
import { TranslationKeys } from '@/locales/keys';
import IconButton from '@/components/UI/IconButton';
import useAccountBalanceModal from '@/hooks/useAccountBalanceModal';

interface BalanceQuickAccessButtonProps {
	style?: any;
}

/**
 * Quick-access button for the foodoffers header: opens the account-balance
 * screen in a modal with the NFC scan already running. Only makes sense on
 * native (NFC isn't available on web) and only when the balance feature is
 * enabled for this server, so both checks live here and the component simply
 * renders nothing otherwise - callers don't need to duplicate the condition.
 */
const BalanceQuickAccessButton: React.FC<BalanceQuickAccessButtonProps> = ({ style }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { appSettings } = useAppSelector(state => state.settings);
	const { openAccountBalanceModal } = useAccountBalanceModal();

	if (isWeb || !appSettings?.balance_enabled) {
		return null;
	}

	return (
		<CustomTooltip
			placement="top"
			trigger={triggerProps => (
				<IconButton
					{...triggerProps}
					onPress={() => openAccountBalanceModal(true)}
					style={style}
					nativeID={AppComponentIds.FOODOFFERS_BALANCE_QUICK_ACCESS}
				>
					<MaterialCommunityIcons name="credit-card-wireless-outline" size={24} color={theme.header.text} />
				</IconButton>
			)}
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
