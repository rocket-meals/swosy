import React, {FunctionComponent} from 'react';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {Heading, View} from '@/components/Themed';
import * as noInternetConnectionSource from '@/assets/animations/no_internet_connection.json';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {DirectusTranslationHelper} from '@/helper/translations/DirectusTranslationHelper';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';

interface AppState {

}
export const PleaseConnectFirstTimeWithInternet: FunctionComponent<AppState> = ({ ...props}) => {
	const [language, setLanguage] = useProfileLanguageCode()

	const defaultText = 'Please connect first time with internet'
	let useText = defaultText

	switch (language) {
	case DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN: useText = 'Bitte verbinden Sie sich das erste Mal mit dem Internet';
	case DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE_ENGLISH: useText = 'Please connect first time with internet';
	}

	const languageCode = language.toLowerCase()
	// At this point the app is not connected to the internet
	// therefore we do not have any translations available or downloaded
	if (languageCode.startsWith('de')) {
		useText = 'Bitte verbinden Sie sich das erste Mal mit dem Internet'
	} else if (languageCode.startsWith('en')) {
		useText = 'Please connect first time with internet'
	} else if (languageCode.startsWith('fr')) {
		useText = 'Veuillez vous connecter la première fois avec Internet'
	} else if (languageCode.startsWith('it')) {
		useText = 'Si prega di connettersi la prima volta con Internet'
	} else if (languageCode.startsWith('es')) {
		useText = 'Conéctese por primera vez con Internet'
	} else if (languageCode.startsWith('pt')) {
		useText = 'Por favor, conecte-se pela primeira vez com a Internet'
	} else if (languageCode.startsWith('nl')) {
		useText = 'Maak voor de eerste keer verbinding met internet'
	} else if (languageCode.startsWith('pl')) {
		useText = 'Połącz się po raz pierwszy z Internetem'
	} else if (languageCode.startsWith('ru')) {
		useText = 'Подключитесь в первый раз к Интернету'
	} else if (languageCode.startsWith('tr')) {
		useText = 'İlk kez internete bağlanın'
	} else if (languageCode.startsWith('zh')) {
		useText = '首次连接互联网'
	} else if (languageCode.startsWith('ja')) {
		useText = '初めてインターネットに接続してください'
	} else if (languageCode.startsWith('ko')) {
		useText = '인터넷에 처음 연결하십시오'
	} else if (languageCode.startsWith('ar')) {
		useText = 'يرجى الاتصال لأول مرة بالإنترنت'
	}

	const accessibilityLabel = useText


	return (
		<MySafeAreaView>
			<View style={{
				width: '100%',
				height: '100%',
				justifyContent: 'center',
				alignItems: 'center'
			}}
			>
				<MyProjectColoredLottieAnimation accessibilityLabel={accessibilityLabel}
					style={{
						width: 300,
						height: 300,
					}}
					source={noInternetConnectionSource}
				/>
				<Heading>
					{accessibilityLabel}
				</Heading>
			</View>

		</MySafeAreaView>
	);
}
