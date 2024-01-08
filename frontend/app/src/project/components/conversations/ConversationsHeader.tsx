import React, {FunctionComponent} from "react";
import {HeaderWithActions} from "../../../kitcheningredients";
import {useAppTranslation} from "../translations/AppTranslation";
import {ReloadIcon} from "../icons/ReloadIcon";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";

export interface AppState{
	route: any
	onRefresh: () => void,
	refreshing: boolean,
}
export const ConversationsHeader: FunctionComponent<AppState> = (props) => {

	const translationReload = useAppTranslation("reload");
	const onRefresh = props?.onRefresh;

	function renderActions(){
		return(
			<>
				<MyTouchableOpacity
					disabled={props?.refreshing}
					accessibilityLabel={translationReload}
							onPress={() => {
								if(onRefresh){
									onRefresh();
								}
							}}>
						<ReloadIcon accessibilityLabel={translationReload} />
				</MyTouchableOpacity>
			</>
		)
	}

	return(
		<HeaderWithActions route={props?.route} title={null} renderActions={renderActions} renderCustomBottom={null} />
	)
}
