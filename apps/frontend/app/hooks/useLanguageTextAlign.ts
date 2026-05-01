import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

export const useLanguageTextAlign = () => {
	const isLtrLanguage = useIsLtrLanguage();

	return isLtrLanguage ? 'left' : 'right';
};

export default useLanguageTextAlign;
