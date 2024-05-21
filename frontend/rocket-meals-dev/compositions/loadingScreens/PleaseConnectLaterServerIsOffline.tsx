import React, {FunctionComponent} from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, View} from '@/components/Themed';
import * as noInternetConnectionSource from '@/assets/animations/no_internet_connection.json';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {DirectusTranslationHelper} from '@/helper/translations/DirectusTranslationHelper';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";

interface AppState {

}
export const PleaseConnectLaterServerIsOffline: FunctionComponent<AppState> = ({ ...props}) => {
	const [language, setLanguage] = useProfileLanguageCode()

	const defaultText = 'The server is offline. Please try again later.'
	let useText = defaultText

	switch (language) {
		case DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN: useText = 'Der Server ist offline. Bitte versuchen Sie es später erneut.'; break;
		case DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE_ENGLISH: useText = 'The server is offline. Please try again later.'; break;
	}

	const languageCode = language.toLowerCase()

	// create translations for the following languages: de, en, fr, it, es, pt, nl, pl, ru, tr, zh, ja, ko, ar

	if (languageCode.startsWith('de')) {
		useText = 'Der Server ist offline. Bitte versuchen Sie es später erneut.'
	} else if (languageCode.startsWith('en')) {
		useText = 'The server is offline. Please try again later.'
	} else if (languageCode.startsWith('fr')) {
		useText = 'Le serveur est hors ligne. Veuillez réessayer plus tard.'
	} else if (languageCode.startsWith('it')) {
		useText = 'Il server è offline. Riprova più tardi.'
	} else if (languageCode.startsWith('es')) {
		useText = 'El servidor está fuera de línea. Por favor, inténtelo de nuevo más tarde.'
	} else if (languageCode.startsWith('pt')) {
		useText = 'O servidor está offline. Por favor, tente novamente mais tarde.'
	} else if (languageCode.startsWith('nl')) {
		useText = 'De server is offline. Probeer het later opnieuw.'
	} else if (languageCode.startsWith('pl')) {
		useText = 'Serwer jest offline. Spróbuj ponownie później.'
	} else if (languageCode.startsWith('ru')) {
		useText = 'Сервер недоступен. Пожалуйста, попробуйте позже.'
	} else if (languageCode.startsWith('tr')) {
		useText = 'Sunucu çevrimdışı. Lütfen daha sonra tekrar deneyin.'
	} else if (languageCode.startsWith('zh')) {
		useText = '服务器离线。请稍后再试。'
	} else if (languageCode.startsWith('ja')) {
		useText = 'サーバーがオフラインです。後でもう一度お試しください。'
	} else if (languageCode.startsWith('ko')) {
		useText = '서버가 오프라인 상태입니다. 나중에 다시 시도해주세요.'
	} else if (languageCode.startsWith('ar')) {
		useText = 'الخادم غير متصل. يرجى المحاولة مرة أخرى لاحقًا.'
	}

	const accessibilityLabel = useText


	return (
		<MySafeAreaView>
			<View style={{
				width: '100%',
				height: '100%',
				padding: SETTINGS_ROW_DEFAULT_PADDING,
				justifyContent: 'center',
				alignItems: 'center'
			}}
			>
				<View style={{
					width: '100%',
					justifyContent: 'center',
					alignItems: 'center',
				}}>
					<Heading>
						{accessibilityLabel}
					</Heading>
				<View style={{
					width: '100%',
					justifyContent: 'center',
					alignItems: 'center',
				}}>
					<RectangleWithLayoutCharactersWide amountOfCharactersWide={30}>
						<MyProjectColoredLottieAnimation style={{
							width: '100%',
							height: '100%'
						}} accessibilityLabel={accessibilityLabel}
														 source={noInternetConnectionSource}
						/>
					</RectangleWithLayoutCharactersWide>
				</View>
				</View>
			</View>

		</MySafeAreaView>
	);
}
