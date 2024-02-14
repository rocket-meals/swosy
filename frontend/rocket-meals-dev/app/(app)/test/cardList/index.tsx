import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {ListRenderItemInfo} from "react-native";
import {useState} from "react";
import {Heading, View} from "@/components/Themed";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";

export default function CardListTestScreen() {

    const initialAmountColumns = useMyGridListDefaultColumns();
    const initialAmountItems = 23;

    const [amountColumns, setAmountColumns] = useState(initialAmountColumns);
    const [amountItems, setAmountItems] = useState(initialAmountItems);

    type DataItem = { key: string; data: { alias: string, image: string | undefined } }

  let data: DataItem[] = []
    let amount = amountItems;
    for (let i = 0; i < amount; i++) {
        data.push({key: i.toString(), data: {
            alias: `Item ${i}`,
            image: undefined
        }})
    }


     const renderItem = (info: ListRenderItemInfo<DataItem>) => {
     const {item, index} = info;
        let title: string = item.data?.alias || "No name"
         if(index === 14){
            title = "This is a very long name for an item"
         }

        return (
                <MyCardForResourcesWithImage
                    key={item.key}
                    text={title}
                    assetId={item.data.image}
                    onPress={() => console.log("Pressed")}
                    accessibilityLabel={title}/>
        );
    }

    function parseValueToInt(value: string | undefined | null, defaultNumber: number): number {
        if (value) {
            return parseInt(value)
        } else {
            return defaultNumber
        }
    }

  return (
    <View
        style={{
            width: "100%",
            height: "100%",
        }}
        >
        <View style={{
            width: "100%",
            paddingBottom: 10,
        }}>
            <Heading>{"Parameters"}</Heading>
            <SettingsRowTextEdit
                leftIcon={"dots-grid"}
                accessibilityLabel={"Edit Grid Amount"} labelLeft={"Edit Grid Amount"} onSave={
                (value) => {
                    setAmountColumns(parseValueToInt(value, initialAmountColumns))
                }
            } labelRight={amountColumns.toString()} />
            <SettingsRowTextEdit
                leftIcon={"view-list"}
                accessibilityLabel={"Edit Amount Items"} labelLeft={"Edit Amount Items"} onSave={
                (value) => {
                    setAmountItems(parseValueToInt(value, initialAmountItems))
                }
            } labelRight={amountItems.toString()} />
        </View>
        <View style={{
            width: "100%",
            height: "100%",
            flex: 1,
        }}>
            <MyGridFlatList
                data={data} renderItem={renderItem} gridAmount={amountColumns} />
        </View>
    </View>
  );
}
