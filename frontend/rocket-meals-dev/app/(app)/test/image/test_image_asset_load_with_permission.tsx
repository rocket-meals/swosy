import {StyleSheet} from 'react-native';
import {Text, TextInput, View} from '@/components/Themed';
import {ServerAPI} from "@/helper/database_helper/server/ServerAPI";
import {useState} from "react";
import {Button, Divider} from "@gluestack-ui/themed";
import {DirectusImage} from "@/components/project/DirectusImage";

export default function HomeScreen() {

    let test_asset_id = "e1f50a58-6218-462d-a388-00e975a2c7d2";

    let heightWidth = 300;

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Test Image load with permission</Text>
          <Text>{"For the Test please login as admin and adapt the test_asset_id"}</Text>
          <View style={{width: heightWidth, height: heightWidth, backgroundColor: "red"}}>
              <DirectusImage assetId={test_asset_id} style={{width: heightWidth, height: heightWidth}} fallbackElement={<View style={{width: heightWidth/2, height: heightWidth/2, backgroundColor: "blue"}} />} />
          </View>

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
