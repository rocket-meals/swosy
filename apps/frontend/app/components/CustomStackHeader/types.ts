import { ReactNode } from 'react';

export interface CustomStackHeaderProps {
        label: string;
        rightElement?: ReactNode;
        /** Replaces the whole "back" handling, e.g. the chat, which returns to the screen it was opened from. */
        onGoBack?: () => void;
}
