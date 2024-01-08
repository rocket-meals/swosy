import {View} from 'native-base';
import React from 'react';
import {ParentSpacer} from "../helper/ParentSpacer";
import {FlatList} from "react-native";

export const GridLayout = ({
                               useFlatList,
                                   amountColoumn,
                                   children,
                                    divider,
                                   ...props
                               }) => {

    if(!children){
        return null;
    }

    let amountChildren = children.length;
    if(amountChildren===0){
        return null;
    }

    let amountRows = Math.ceil(amountChildren/amountColoumn);
    let rows = [];
    for(let rowIndex =0; rowIndex<amountRows; rowIndex++){
        let row = [];
        for(let columnIndex = 0; columnIndex<amountColoumn; columnIndex++){
            let child = children[rowIndex*amountColoumn+columnIndex];
            row.push(<View key={"gridlayout_"+rowIndex+"_"+columnIndex} style={{flex: 1}}>{child}</View>);
        }
        rows.push(<ParentSpacer space={props?.paddingHorizontalValue} key={"gridlayout_"+rowIndex} style={{flexDirection: "row"}}>{row}</ParentSpacer>);
        if(divider!==undefined){
            rows.push(divider)
        }
    }

    if (useFlatList) {
        // FlatList renderer
        const renderItem = ({item, index}) => {
            console.log("GridLayout renderItem: "+index)

            return item;
        };

//        rows = [1,2,3,4,5];

        return(
            <View style={{flex: 1}}>
                <FlatList
                    data={rows}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => "gridlayout_" + index}
                    {...props}
                />
            </View>
        )
    }

    return (
        <View style={{flex: 1}}>
            {rows}
        </View>
    );

};
