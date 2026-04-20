export interface SettingsListNicknameProps {
        initialValue?: string;
        onSave: (value: string) => void;
        groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
        leftIcon?: React.ReactNode;
        iconBgColor?: string;
}
