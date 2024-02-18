import {useFocusEffect, useRouter} from "expo-router";
import {useState} from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {Heading, Text, View} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";

export default function TabOneScreen() {

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  console.log("Rendering (app)/index.tsx")

  useFocusEffect(() => {
    // Call the replace method to redirect to a new route without adding to the history.
    // We do this in a useFocusEffect to ensure the redirect happens every time the screen
    // is focused.
    try {
        //router.push('/foodoffers/')
    } catch (e: any) {
        setError(e.message)
    }
  });

  return <MySafeAreaView>
    <MyScrollView>
        <View >
            <Heading>{"Loading..."}</Heading>
          <MyButton accessibilityLabel={"Retry /foodoffers/"} onPress={() => {
            try {
              router.push('/foodoffers/')
            } catch (e: any) {
              setError(e.message)
            }
          } } text={"Retry /foodoffers/"}/>
          <MyButton accessibilityLabel={"Retry /home/"} onPress={() => {
            try {
              router.push('/home/')
            } catch (e: any) {
              setError(e.message)
            }
          } } text={"Retry /home/"}/>
          <MyButton accessibilityLabel={"Retry /fail/"} onPress={() => {
            try {
              router.push('/fail/')
            } catch (e: any) {
              setError(e.message)
            }
          } } text={"Retry /fail/"}/>
            <Text>{error}</Text>
        </View>
    </MyScrollView>
  </MySafeAreaView>
}