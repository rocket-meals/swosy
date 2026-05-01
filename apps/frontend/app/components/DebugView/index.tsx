import React, { ReactNode, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/hooks/useTheme';
import useDebugMode from '@/hooks/useDebugMode';
import { useAppSelector } from '@/redux/hooks';
import styles from './styles';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

export type DebugLog = string | { message: string; timestamp?: string | Date };

export type DebugAction = {
        label: string;
        onPress?: () => void;
        icon?: keyof typeof MaterialCommunityIcons.glyphMap;
        backgroundColor?: string;
        borderColor?: string;
        textColor?: string;
        disabled?: boolean;
};

/**
 * Shared base props for overlay/panel components that can display a title,
 * control their own visibility, and render arbitrary children.
 */
export interface OverlayBaseProps {
        title?: string;
        isVisible?: boolean;
        children?: ReactNode;
}

interface DebugViewProps extends OverlayBaseProps {
        logs?: DebugLog[];
        actions?: DebugAction[];
        showInDevMode?: boolean;
}

const DebugView: React.FC<DebugViewProps> = ({
        title,
        logs = [],
        actions = [],
        isVisible = false,
        showInDevMode = false,
        children,
}) => {
        const { theme } = useTheme();
        const isLtrLanguage = useIsLtrLanguage();
        const { translate } = useLanguage();
        const debugMode = useDebugMode();
        const isDevMode = useAppSelector((state) => state.authReducer.isDevMode);
        const resolvedTitle = title ?? translate(TranslationKeys.debug);

        const formattedLogs = useMemo(() => {
                return logs
                        ?.map(log => {
                                if (typeof log === 'string') return log;

                                const timestamp = log.timestamp
                                        ? typeof log.timestamp === 'string'
                                                ? log.timestamp
                                                : log.timestamp.toLocaleString()
                                        : null;

                                return timestamp ? `${timestamp} - ${log.message}` : log.message;
                        })
                        .filter(Boolean);
        }, [logs]);

        const shouldRender = isVisible || debugMode || (showInDevMode && isDevMode);
        if (!shouldRender) return null;

        return (
                <View
                        style={[
                                styles.container,
                        ]}
                >
                        <View style={[styles.header, !isLtrLanguage ? { flexDirection: 'row-reverse' } : undefined]}>
                                <MaterialCommunityIcons name="bug-outline" size={18} color={theme.screen.icon} />
                                <Text style={{ ...styles.title, color: theme.screen.text }}>{resolvedTitle}</Text>
                        </View>

                        {actions.length ? (
                                <View style={[styles.actionsContainer, !isLtrLanguage ? { justifyContent: 'flex-end' } : undefined]}>
                                        {actions.map((action, index) => (
                                                <TouchableOpacity
                                                        key={`${action.label}-${index}`}
                                                        onPress={action.onPress}
                                                        disabled={action.disabled}
                                                        style={[
                                                                styles.actionButton,
                                                                {
                                                                        backgroundColor:
                                                                                action.backgroundColor ?? theme.drawerHeading,
                                                                        borderColor: action.borderColor ?? theme.screen.iconBg,
                                                                        opacity: action.disabled ? 0.6 : 1,
                                                                },
                                                        ]}
                                                >
                                                        {action.icon ? (
                                                                <MaterialCommunityIcons
                                                                        name={action.icon}
                                                                        size={18}
                                                                        color={action.textColor ?? theme.screen.icon}
                                                                        style={styles.actionIcon}
                                                                />
                                                        ) : null}
                                                        <Text
                                                                style={{
                                                                        ...styles.actionLabel,
                                                                        color: action.textColor ?? theme.screen.text,
                                                                }}
                                                        >
                                                                {action.label}
                                                        </Text>
                                                </TouchableOpacity>
                                        ))}
                                </View>
                        ) : null}

                        {children}

                        {formattedLogs?.length ? (
                                <View style={styles.logsContainer}>
                                        {formattedLogs.map((log, index) => (
                                                <Text
                                                        // eslint-disable-next-line react/no-array-index-key
                                                        key={`${log}-${index}`}
                                                        style={{ ...styles.logText, color: theme.inactiveText }}
                                                >
                                                        {log}
                                                </Text>
                                        ))}
                                </View>
                        ) : null}
                </View>
        );
};

export default DebugView;
