import {StyleSheet} from 'react-native';
import {Text} from '@/components/Themed';
import {useFocusEffect, useRouter} from "expo-router";

export default function TabOneScreen() {

  const router = useRouter();

  useFocusEffect(() => {
    // Call the replace method to redirect to a new route without adding to the history.
    // We do this in a useFocusEffect to ensure the redirect happens every time the screen
    // is focused.
    router.push('/home')

    // TODO: https://docs.expo.dev/router/reference/redirects/
    // replace does not work on. Tested on web
    // router.replace('/home')
  });

  return null;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
