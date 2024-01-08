import React, { useEffect, useState, FunctionComponent } from "react";
import { FlatList, Text, View } from "native-base";
import { BasePadding } from "../../../kitcheningredients";
import { AnimationAllergene } from "../../components/animations/AnimationAllergene";
import { AppTranslation } from "../../components/translations/AppTranslation";
import { MarkingSetting } from "../../components/marking/MarkingSetting";
import { NotFound } from "../../components/animations/NotFound";
import { useSynchedMarkingsDict } from "../../helper/synchedJSONState";
import { Markings } from "../../directusTypes/types";

export const SettingMarking: FunctionComponent = (props) => {
	const [mounted, setMounted] = useState(false);
	const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();
	const allMarkings: Markings[] = Object.values(allMarkingsDict);

	// corresponding componentDidMount
	useEffect(() => {
		setMounted(true);
	}, [props?.route?.params]);

	const ListHeader = () => (
		<View style={{ width: "100%" }}>
			<BasePadding>
				<Text fontSize={"md"}>
					<AppTranslation id={"settingsMarkingHelpText"} />
				</Text>
				<AnimationAllergene />
			</BasePadding>
		</View>
	);

	const renderItem = ({ item }) => <MarkingSetting marking={item} key={item.id + ""} />;

	return (
			<FlatList
				data={allMarkings}
				ListHeaderComponent={ListHeader}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
			/>
	);
};
