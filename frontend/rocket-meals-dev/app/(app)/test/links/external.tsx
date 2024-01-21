import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import * as Linking from 'expo-linking';

export default function HomeScreen() {

    const linkingUseUrl = Linking.useURL();
    const linkingCreateUrl = Linking.createURL("/");

  return (
      <View style={styles.container}>
          <Text>{"linkingUseUrl: "+linkingUseUrl}</Text>
          <Text>{"linkingCreateUrl: "+linkingCreateUrl}</Text>
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
