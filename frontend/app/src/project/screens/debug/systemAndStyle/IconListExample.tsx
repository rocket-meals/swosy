import React, {useEffect, useState} from "react";
import {Box, Divider, Slider, Stack, View, Text, Input} from "native-base";
import {GridList} from "../../../components/GridList";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {Icon, TextWithIcon} from "../../../../kitcheningredients";

export const IconListExample = (props) => {

	const [search, setSearch] = useState("");

	function renderIcon(icon){
		return (
			<View key={icon} style={{margin: 10, flexDirection: "column"}}>
				<Icon name={icon} />
				<Text>{icon}</Text>
			</View>
		)
	}

	function filterForSearch(allKeys){
		if(search===""){
			return allKeys;
		} else {
			let results = [];
			for(let key of allKeys){
				if((key.toLowerCase()+"").includes(search.toLowerCase())){
					results.push(key);
				}
			}
			return results;
		}
	}

	function renderIcons(){
		let icons = MaterialCommunityIcons.getRawGlyphMap();
		let output = [];
		let keys = filterForSearch(Object.keys(icons));
		for(let i=0; i<100; i++){
			let icon = keys[i];
			output.push(renderIcon(icon))
		}
		return output;
	}

	return(
		<View style={{width: "100%"}}>
			<Text>{"Search for: "}</Text>
			<Input style={{flex: 1}} value={search} onChangeText={(newSearch) => {setSearch(newSearch)}} />
			<Text>{"Results"}</Text>
			<GridList useFlatList={true} >
				{renderIcons()}
			</GridList>
		</View>
	)
}
