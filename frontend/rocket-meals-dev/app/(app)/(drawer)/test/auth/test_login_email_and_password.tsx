import {StyleSheet} from 'react-native';
import {Text, View, TextInput} from '@/components/Themed';
import {BottomRow} from "@/app/(app)/(drawer)/_layout";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {ServerAPI, ServerInfo} from "@/helper/database_helper/server/ServerAPI";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {useState} from "react";
import {Button, Divider} from "@gluestack-ui/themed";

export default function HomeScreen() {

  // define state variables email and password
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // define result variable
  const [result, setResult] = useState<any>("");

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Test Login with E-Mail and Password</Text>
          <TextInput
              variant="outline"
              size="md"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
              value={email} onChangeText={setEmail}
              placeholder={"E-Mail"}
          />
          <TextInput
              variant="outline"
              size="md"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
              value={password} onChangeText={setPassword}
              placeholder={"Password"}
          />
        <Divider />
        <Button onPress={() => {
          ServerAPI.login_with_email_and_password(email, password).then((result) => {
            setResult(result);
          }).catch((error) => {
            setResult(error);
          })
        }
        }>
          <Text>{"Sign In"}</Text>
        </Button>
        <Divider />
        <Text>{"Result"}</Text>
        <Text>{JSON.stringify(result, null, 2)}</Text>
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
