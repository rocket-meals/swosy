import {StyleSheet} from 'react-native';
import {Text, TextInput, View} from '@/components/Themed';
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";

export default function HomeScreen() {

  const [exampleValue, setExampleValue] = useSyncState<string>(NonPersistentStore.test);

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Sync Screen Second Non Persistent</Text>

        <TextInput placeholder="change me"  value={exampleValue || ""} onChangeText={(text) => {
          setExampleValue(text);
        }} />
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
