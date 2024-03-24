import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Apartments} from "@/helper/database/databaseTypes/types";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {DateHelper} from "@/helper/date/DateHelper";
import {Text, View} from "@/components/Themed";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export type FreeRoomBadgeProps = {
	apartment: Apartments,
	borderRadius?: number,
}
export const FreeRoomBadge = ({apartment, borderRadius}: FreeRoomBadgeProps) => {
	const translation_free_rooms = useTranslation(TranslationKeys.free_rooms);
	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()
	const locale = useProfileLocaleForJsDate()

	let available_from = apartment.available_from;
	let available_from_date = available_from ? new Date(available_from) : new Date();
	let readableAvailableFrom = DateHelper.useSmartReadableDate(available_from_date, locale)

	if(!available_from){
		return null;
	}


	const accessibilityLabel = translation_free_rooms+": "+readableAvailableFrom;

	const config: MyGlobalActionSheetConfig = {
		visible: true,
		title: translation_free_rooms,
		renderCustomContent: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
			// Use the custom context provider to provide the input value and setter
			return <MySafeAreaView>
				<MyScrollView>
					<View style={{
						width: "100%",
					}}>
						<Text style={{
							textAlign: "center",
						}}>{accessibilityLabel}</Text>
					</View>
				</MyScrollView>
			</MySafeAreaView>
		}
	}

	const dislike_icon = IconNames.sort_free_rooms_icon;

	return 	<MyButton
		isActive={true}
		borderRadius={borderRadius}
		onPress={() => {
			show(config)
		}}
		accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={dislike_icon} />
}