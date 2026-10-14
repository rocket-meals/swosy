import { ReactNode } from 'react';

export interface CustomStackHeaderProps {
        label: string;
        rightElement?: ReactNode;
        /** Where "back" goes, instead of the target derived from the pathname, e.g. the chat of a food feedback back to the own ratings. */
        goBackTarget?: string;
}
