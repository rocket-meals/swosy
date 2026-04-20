export interface SettingsListNicknameProps {
        initialValue?: string;
        onSave: (value: string) => void;
        groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
}
