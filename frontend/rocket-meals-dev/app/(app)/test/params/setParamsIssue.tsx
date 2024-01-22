import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import * as Linking from 'expo-linking';
import {router, useLocalSearchParams} from "expo-router";
import {Button} from "@gluestack-ui/themed";

export default function HomeScreen() {

    const localSearchParams = useLocalSearchParams(); // TODO: Need to check which one to use

  return (
      <View style={styles.container}>
          <Text>{"This page shall show the params setting issue"}</Text>
          <Text>{"When you visit the page via /test/params/setParamsIssue everything works fine"}</Text>
          <Text>{"When you visit the page via /test/params/setParamsIssue?test=123 the url wont update correct but the printed params"}</Text>
          <Button
              onPress={() => {
                  router.setParams({test: "123"})
              }}>
              <Text>
                  {"Set Test"}
              </Text>
          </Button>
          <Button
              onPress={() => {
                  router.setParams({test: undefined})
              }}>
              <Text>
                  {"Clear Params"}
              </Text>
          </Button>
          <Text>{"localSearchParams: "}</Text>
          <Text>{JSON.stringify(localSearchParams, null, 2)}</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
