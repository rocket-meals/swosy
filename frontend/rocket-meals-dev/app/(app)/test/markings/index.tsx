import {Heading, View, Text} from "@/components/Themed";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MyButton} from "@/components/buttons/MyButton";

export default function MarkingsTestScreen() {

    const [markingsDict, setMarkingsDict, lastUpdateMarkings, updateMarkingsFromServer] = useSynchedMarkingsDict()

  return (
    <MySafeAreaView>
        <MyScrollView>
            <Heading>
                {"Markings"}
            </Heading>
            <MyButton accessibilityLabel={"Update Markings"} onPress={() => {
                updateMarkingsFromServer()
            } } tooltip={
                "Update Markings"
            }
            text={
                "Update Markings"
            }
            />
            <View style={{
                width: "100%",
            }}>
                <Text>
                    {JSON.stringify(markingsDict, null, 2)}
                </Text>
            </View>
        </MyScrollView>
    </MySafeAreaView>
  );
}
