import {StyleSheet} from 'react-native';
import {useFocusEffect, useRouter} from "expo-router";

export default function TabOneScreen() {

  const router = useRouter();

  useFocusEffect(() => {
    // Call the replace method to redirect to a new route without adding to the history.
    // We do this in a useFocusEffect to ensure the redirect happens every time the screen
    // is focused.
    router.push('/foodoffers')

    // TODO: https://docs.expo.dev/router/reference/redirects/
    // replace does not work on. Tested on web
    // router.replace('/home')
  });

  return null;
}