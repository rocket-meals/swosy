import React, {FunctionComponent, useEffect, useState} from "react";
import {
	BaseNoPaddingTemplate,
	BasePadding,
	HeaderWithActions,
	Icon,
	Navigation,
	NavigatorHelper
} from "../../../kitcheningredients";
import {Text, View} from "native-base";
import {ProfileAPI} from "../../components/profile/ProfileAPI";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {useDebugMode} from "../../helper/synchedJSONState";
import {AnimationPriceGroup} from "../../components/animations/AnimationPriceGroup";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {SettingsRowOption} from "../../components/settings/SettingsRowOption";

export const SettingPriceGroup: FunctionComponent = (props) => {

	const params = props?.route?.params

	const [priceGroup, setPriceGroup, priceGroups] = ProfileAPI.useSynchedPriceGroup();
	const title = useAppTranslation("price_group");
	const translationSelect = useAppTranslation("select");
	const priceGroupTranslation = priceGroups[priceGroup]?.label;

	const [debug, setDebug] = useDebugMode()
	const [showMore, setShowMore] = useState(false);

	async function onPress(option){
		if(option){
			setPriceGroup(option);
			if(params?.showbackbutton){
				Navigation.navigateBack();
			} else if(params?.goHome){
				Navigation.navigateHome()
//				NavigatorHelper.navigateHome();
			}
		}
	}

	// corresponding componentDidMount
	useEffect(() => {

	}, [params])

	function renderDebug(){
		if(debug){
			let debugContent = null
			if(showMore){
				debugContent = (
					<View style={{flexDirection: "column"}}>
						<Text>{"profile.canteen"}</Text>
						<Text>{JSON.stringify(NavigatorHelper.getHistory())}</Text>
						<Text>{JSON.stringify(priceGroup, null, 2)}</Text>
						<Text>{JSON.stringify(priceGroups, null, 2)}</Text>
					</View>
				)
			}

			return (
				<>
					<SettingsRow leftIcon={<Icon name={"bug"} />} leftContent={"Debug"} rightIcon={<Icon name={"bug"} />}  onPress={
						() => {setShowMore(!showMore)}
					}/>
					{debugContent}
				</>
			)
		}
	}

	const header = <HeaderWithActions route={props?.route} showbackbutton={props?.route?.params?.showbackbutton} title={title} />

	function renderPriceGroupOptions(){
		let output = [];
		let priceGroupKeys = Object.keys(priceGroups)
		for(let priceGroupsToChooseKey of priceGroupKeys){
			let priceGroupInformations = priceGroups[priceGroupsToChooseKey];
			let label = priceGroupInformations?.label;
			let iconName = priceGroupInformations?.icon;

			let active = priceGroupsToChooseKey === priceGroup;

			output.push(<SettingsRowOption active={active} accessibilityLabel={translationSelect+": "+label}
										   leftIcon={iconName} onPress={() => {
				onPress(priceGroupsToChooseKey)
			}}  leftContent={label}
			/>)
		}
		return output;
	}


	return(
		<View style={{width: "100%", height: "100%", flex: 1}}>
			<BaseNoPaddingTemplate header={header} route={props?.route} >
				<BasePadding>
					<AnimationPriceGroup />
				</BasePadding>
				<View style={{width: "100%"}}>
					{renderDebug()}
					{renderPriceGroupOptions()}
				</View>
			</BaseNoPaddingTemplate>

		</View>
	)
}
