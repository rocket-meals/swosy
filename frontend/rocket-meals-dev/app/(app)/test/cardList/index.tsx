import {MyGridList} from "@/components/grid/MyGridList";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {ListRenderItemInfo} from "react-native";
import {useState} from "react";
import {Heading, View} from "@/components/Themed";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";

export default function CardListTestScreen() {

    const initialAmountColumns = 2;
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
        const title: string = item.data?.alias || "No name"

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
            backgroundColor: "red",
            paddingBottom: 10,
        }}>
            <Heading>{"Parameters"}</Heading>
            <SettingsRowTextEdit
                leftIcon={"dots-grid"}
                accessibilityLabel={"Edit Grid Amount"} label={"Edit Grid Amount"} onSave={
                (value) => {
                    setAmountColumns(parseValueToInt(value, initialAmountColumns))
                }
            } labelRight={amountColumns.toString()} />
            <SettingsRowTextEdit
                leftIcon={"view-list"}
                accessibilityLabel={"Edit Amount Items"} label={"Edit Amount Items"} onSave={
                (value) => {
                    setAmountItems(parseValueToInt(value, initialAmountItems))
                }
            } labelRight={amountItems.toString()} />
        </View>
        <View style={{
            width: "100%",
            height: "100%",
            flex: 1,
            backgroundColor: "green",
        }}>
            <MyGridList
                data={data} renderItem={renderItem} gridAmount={amountColumns} />
        </View>
    </View>
  );
}
