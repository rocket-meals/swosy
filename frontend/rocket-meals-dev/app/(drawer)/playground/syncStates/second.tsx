import {StyleSheet, TextInput} from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import {BottomRow} from "@/app/(drawer)/_layout";
import {useSyncState} from "@/helper/syncStateHelper/SyncState";
import {SyncStateVariablesNonPersistent} from "@/helper/syncStateHelper/SyncStateVariablesNonPersistent";

export default function HomeScreen() {

  const [exampleValue, setExampleValue] = useSyncState<string>(SyncStateVariablesNonPersistent.playground);

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Sync Screen Second</Text>

        <TextInput placeholder="change me"  value={exampleValue || ""} onChangeText={(text) => {
          setExampleValue(text);
        }} />
        <BottomRow />
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
