import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {BottomRow} from "@/app/(app)/(drawer)/_layout";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerInfo} from "@/helper/database_helper/server/ServerAPI";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export default function HomeScreen() {

  const [serverInfo, setServerInfo] = useSyncState<ServerInfo>(PersistentStore.server_info);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Info</Text>

      <Text>{JSON.stringify(serverInfo, null, 2)}</Text>
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
