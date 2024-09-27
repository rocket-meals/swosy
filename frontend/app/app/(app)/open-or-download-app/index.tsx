import React from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {Heading, Text, useViewBackgroundColor, View} from "@/components/Themed";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {useLoadingLogo} from "@/compositions/loadingScreens/LoadingLogoProvider";
import {RectangleWithLayoutCharactersWide, useCharacterWithInPixel} from "@/components/shapes/Rectangle";
import {useProjectName} from "@/states/ProjectInfo";
import {MyButton} from "@/components/buttons/MyButton";
import {ProjectLogo} from "@/components/project/ProjectLogo";
import {ProjectBackgroundImage} from "@/components/project/ProjectBackgroundImage";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export function getRouteToOpenOrDownloadAppScreen(){
	return "open-or-download-app"
}

export default function OpenOrDownloadAppScreen() {

	const project_name = useProjectName();
	const translation_download_app = useTranslation(TranslationKeys.download_or_open_the_app)
	const translation_is_app_already_installed = useTranslation(TranslationKeys.is_app_already_installed)
	const translation_open_app = "Open App";
	const logoWidthInCharacters = 10;
	const widthByCharacters = useCharacterWithInPixel(logoWidthInCharacters+15)
	const borderRadius = useCharacterWithInPixel(1)
	const viewBackgroundColor = useViewBackgroundColor();
	const [appSettings, setAppSettings] = useSynchedAppSettings();
	const iOSLink = appSettings?.app_stores_url_to_apple
	const androidLink = appSettings?.app_stores_url_to_google
	const download_text_apple = "App Store"
	const download_text_google = "Google Play"

	function renderPlatformButton(link: string, text: string, icon: string){
		return (
			<View style={{
				width: "100%",
				paddingVertical: 5,
			}}>
				<MyButton leftIcon={icon} useOnlyNecessarySpace={false} isActive={true} accessibilityLabel={text} text={text} onPress={async () => {
					await CommonSystemActionHelper.openExternalURL(link, true)
				}} />
			</View>
		)
	}

	function renderPlatformButtons(){
		const buttons = []
		if(iOSLink){
			buttons.push(renderPlatformButton(iOSLink, download_text_apple, IconNames.brand_apple_icon))
		}
		if(androidLink){
			buttons.push(renderPlatformButton(androidLink, download_text_google, IconNames.brand_google_play_icon))
		}
		return buttons
	}

	return (
		<MySafeAreaView>
			<View style={{
				position: 'absolute',
				width: '100%',
				height: '100%',
			}}>
				<ProjectBackgroundImage />
			</View>
			<MyScrollView>
				<View style={{height: 40,width: "100%"}} />
				<View style={{
					width: "100%",
					justifyContent: "center",
					alignItems: "center",
				}}>
					<View style={{
						width: widthByCharacters,
						backgroundColor: viewBackgroundColor,
						padding: borderRadius*2,
						borderRadius: borderRadius,
						justifyContent: "center",
						alignItems: "center",
					}}>
						<View style={{height: 40,width: "100%"}} />
						<RectangleWithLayoutCharactersWide amountOfCharactersWide={logoWidthInCharacters}>
							<ProjectLogo style={{width: "100%", height: "100%"}}/>
						</RectangleWithLayoutCharactersWide>
						<View style={{height: 20,width: "100%"}} />
						<Heading>{project_name}</Heading>
						<View style={{height: 20,width: "100%"}} />
						<View>
							<Text>
								{translation_download_app}
							</Text>
						</View>
						<View style={{height: 20,width: "100%"}} />
						<View style={{
							width: "100%",
						}}>
							{renderPlatformButtons()}
						</View>
						<View style={{height: 40,width: "100%"}} />
					</View>
				</View>
			</MyScrollView>
		</MySafeAreaView>
	)
}