import { useAppSelector } from '@/redux/hooks';

export const isLtrLanguageCode = (language?: string | null) => language !== 'ar';

export const useIsLtrLanguage = () => {
	const language = useAppSelector((state) => state.settings.language);

	return isLtrLanguageCode(language);
};

export default useIsLtrLanguage;
