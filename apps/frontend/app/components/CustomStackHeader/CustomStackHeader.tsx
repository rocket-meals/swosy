import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { isWeb } from '@/constants/Constants';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { CustomStackHeaderProps } from './types';
import { usePathname, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { excerpt } from '@/constants/HelperFunctions';
import { CustomTooltip, TooltipContent, TooltipText } from '@/components/CustomTooltip';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

import { AppScreens } from 'repo-depkit-common';

const BackTriggerButton = ({ triggerProps, onPress, color }: { triggerProps: object; onPress: () => void; color: string }) => (
	<TouchableOpacity activeOpacity={0.4} {...triggerProps} onPress={onPress} style={{ padding: 10 }}>
		<Ionicons name="arrow-back" size={26} color={color} />
	</TouchableOpacity>
);

const makeBackTrigger = (onPress: () => void, color: string) => (triggerProps: object) => (
	<BackTriggerButton triggerProps={triggerProps} onPress={onPress} color={color} />
);

/**
 * Resolves which screen "go back" should navigate to, based on the current
 * pathname. Returns null when the router's own back-stack should be used
 * instead (`router.back()`).
 */
function resolveGoBackTarget(pathname: string, loggedIn: boolean, canGoBack: boolean): string | null {
	if (pathname.includes(`/${AppScreens.FOOD_OFFERS}/details`)) {
		return `/${AppScreens.FOOD_OFFERS}`;
	} else if (pathname.includes(`/${AppScreens.HOUSING}/details`)) {
		return `/${AppScreens.HOUSING}`;
	} else if (pathname.includes(`/${AppScreens.STATISTICS}`)) {
		return `/${AppScreens.MANAGEMENT}`;
	} else if (pathname.includes(`/${AppScreens.SUPPORT_TICKET}`)) {
		return `/${AppScreens.SUPPORT_FAQ}`;
	} else if (pathname.includes(`/${AppScreens.FEEDBACK_SUPPORT}`)) {
		return `/${AppScreens.SUPPORT_FAQ}`;
	} else if (pathname.includes(`/${AppScreens.SUPPORT_FAQ}`)) {
		return `/${AppScreens.SETTINGS}`;
	} else if (pathname.includes(`/${AppScreens.HOUSING_DELETE_USER}`)) {
		return loggedIn ? `/${AppScreens.SETTINGS}` : `/${AppScreens.LOGIN}`;
	} else if (pathname.includes(`/${AppScreens.CAMPUS}/details`)) {
		return `/${AppScreens.CAMPUS}`;
	} else if (pathname.includes(`/${AppScreens.LIST_WEEK_SCREEN}`)) {
		return `/${AppScreens.FOOD_PLAN_WEEK}`;
	} else if (pathname.includes(`/${AppScreens.FOOD_PLAN_WEEK}`)) {
		return `/${AppScreens.MANAGEMENT}`;
	} else if (pathname.includes(`/${AppScreens.FORMS}`)) {
		return `/${AppScreens.FORM_CATEGORIES}`;
	} else if (pathname.includes(`/${AppScreens.FORM_CATEGORIES}`)) {
		return `/${AppScreens.MANAGEMENT}`;
	} else if (pathname.includes('/chats/details')) {
		return '/chats';
	} else if (canGoBack) {
		return null;
	} else if (loggedIn) {
		return `/${AppScreens.FOOD_OFFERS}`;
	} else {
		return `/${AppScreens.LOGIN}`;
	}
}

const CustomStackHeader: React.FC<CustomStackHeaderProps> = ({ label, rightElement }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const router = useRouter();
	const pathname = usePathname();
	const { loggedIn } = useAppSelector(state => state.authReducer);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

	const handleGoback = () => {
		const target = resolveGoBackTarget(pathname, loggedIn, router.canGoBack());
		if (target) {
			router.navigate(target);
		} else {
			router.back();
		}
	};

	useEffect(() => {
		const handleResize = () => {
			setScreenWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', handleResize);

		return () => subscription?.remove();
	}, []);

	const mediumScreenHeadingLength = screenWidth > 700 ? 80 : 22;
	const headingMaxLength = screenWidth > 900 ? 100 : mediumScreenHeadingLength;

	return (
		<View
			style={{
				...styles.header,
				backgroundColor: theme.header.background,
				paddingHorizontal: isWeb ? 20 : 10,
			}}
		>
                        <View style={styles.row}>
                                <View style={styles.col1}>
					<CustomTooltip
						placement="top"
						trigger={makeBackTrigger(handleGoback, theme.header.text)}
					>
						<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
							<TooltipText fontSize="$sm" color={theme.tooltip.text}>
								{`${translate(TranslationKeys.navigate_back)}`}
							</TooltipText>
						</TooltipContent>
					</CustomTooltip>

					<Text style={{ ...styles.heading, color: theme.header.text }}>{excerpt(label, headingMaxLength)}</Text>
                                </View>
                                {rightElement ? <View style={styles.col2}>{rightElement}</View> : null}
                        </View>
                </View>
        );
};

export default CustomStackHeader;
