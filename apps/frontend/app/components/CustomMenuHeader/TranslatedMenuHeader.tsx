import React from 'react';
import CustomMenuHeader from './CustomMenuHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

interface TranslatedMenuHeaderProps {
	labelKey: TranslationKeys;
	headerKey?: string;
}

// Screen `options.header` render-props in `(app)/_layout.tsx` are almost all
// "translate one key, render CustomMenuHeader" — this wraps that so the
// layout can reference a stable component instead of defining a new arrow
// (closing over `translate`) on every render.
const TranslatedMenuHeader: React.FC<TranslatedMenuHeaderProps> = ({ labelKey, headerKey }) => {
	const { translate } = useLanguage();
	return <CustomMenuHeader label={translate(labelKey)} key={headerKey} />;
};

export default TranslatedMenuHeader;
