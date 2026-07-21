import React, { ReactNode } from 'react';
import CustomStackHeader from './CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

interface TranslatedStackHeaderProps {
	labelKey: TranslationKeys;
	headerKey?: string;
	rightElement?: ReactNode;
}

// Screen `options.header` render-props in the various `_layout.tsx` files are
// almost all "translate one key, render CustomStackHeader" — this wraps that
// so each `_layout.tsx` can reference a stable component instead of defining
// a new arrow (closing over `translate`) on every render.
const TranslatedStackHeader: React.FC<TranslatedStackHeaderProps> = ({ labelKey, headerKey, rightElement }) => {
	const { translate } = useLanguage();
	return <CustomStackHeader label={translate(labelKey)} key={headerKey} rightElement={rightElement} />;
};

export default TranslatedStackHeader;
