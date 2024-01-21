import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {useServerInfo} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";

export default function HomeScreen() {

  const serverInfo = useServerInfo()
  const server_url = ServerAPI.getServerUrl();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Url</Text>
      <Text>{server_url}</Text>

      <Text style={styles.title}>Server Info</Text>
      <Text>{JSON.stringify(serverInfo, null, 2)}</Text>
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
