import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {router, useFocusEffect} from "expo-router";
import {MyButton} from "@/components/buttons/MyButton";

export default function HomeScreen() {

  useFocusEffect(() => {
    // Call the replace method to redirect to a new route without adding to the history.
    // We do this in a useFocusEffect to ensure the redirect happens every time the screen
    // is focused.
    //router.push('/foodoffers') // does not work on expo go (not local test) on android
    //router.push('/home')

    // TODO: https://docs.expo.dev/router/reference/redirects/
    // replace does not work on. Tested on web
    // router.replace('/home')
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{"Home"}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <MyButton accessibilityLabel={"Go to Food Offers"} text={"Go to Food Offers"} onPress={() => router.push('/foodoffers')}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
