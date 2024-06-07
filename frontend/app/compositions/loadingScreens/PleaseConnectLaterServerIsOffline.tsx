import React, {FunctionComponent} from 'react';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {Heading, View} from '@/components/Themed';
import * as noInternetConnectionSource from '@/assets/animations/no_internet_connection.json';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {DirectusTranslationHelper} from '@/helper/translations/DirectusTranslationHelper';
import {MyProjectColoredLottieAnimation} from '@/components/lottie/MyProjectColoredLottieAnimation';
import {RectangleWithLayoutCharactersWide} from "@/components/shapes/Rectangle";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {RootTranslationKey, useRootTranslation} from "@/helper/translations/RootTranslation";

interface AppState {

}
export const PleaseConnectLaterServerIsOffline: FunctionComponent<AppState> = ({ ...props}) => {
	const useText = useRootTranslation(RootTranslationKey.SERVER_IS_OFFLINE)

	const accessibilityLabel = useText


	return (
		<MySafeAreaViewThemed>
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

		</MySafeAreaViewThemed>
	);
}
