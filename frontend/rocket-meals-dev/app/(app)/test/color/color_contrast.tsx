import {StyleSheet} from 'react-native';
import {Text, TextInput, useViewBackgroundColor, View} from '@/components/Themed';
import {Button, Divider} from "@gluestack-ui/themed";
import {useInsets} from "@/helper/device/DeviceHelper";
import {
    getContrastRatio,
    useLighterOrDarkerColorForSelection,
    useMyContrastColor
} from "@/helper/color/MyContrastColor";
import {useProjectColor} from "@/states/ProjectInfo";

export default function HomeScreen() {

    const projectColor = useProjectColor()
    const projectContrastColor = useMyContrastColor(projectColor);
    const contrastRatioProjectContrastColor = getContrastRatio(projectColor, projectContrastColor)

    const viewBackgroundColor = useViewBackgroundColor()
    const myContrastColorBackground = useMyContrastColor(viewBackgroundColor)

    const darkerViewBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const myContrastColorDarkerBackground = useMyContrastColor(darkerViewBackgroundColor)

    const contrastRatioViewBackgroundColorBlack = getContrastRatio(viewBackgroundColor, "#000000")
    const contrastRatioViewBackgroundColorWhite = getContrastRatio(viewBackgroundColor, "#FFFFFF")

    const contrastRatioDarkerViewBackgroundColorBlack = getContrastRatio(darkerViewBackgroundColor, "#000000")
    const contrastRatioDarkerViewBackgroundColorWhite = getContrastRatio(darkerViewBackgroundColor, "#FFFFFF")

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Color Information</Text>
        <Divider />
          <View style={{width: "100%", height: 20, backgroundColor: projectColor}}>
              <Text style={{color: projectContrastColor}}>{"contrastRatioProjectContrastColor: "+contrastRatioProjectContrastColor}</Text>
          </View>
        <Text>{"viewBackgroundColor: "+viewBackgroundColor}</Text>
          <View style={{width: 20, height: 20, backgroundColor: viewBackgroundColor}}></View>
          <Divider />
            <Text>{"myContrastColorBackground: "+myContrastColorBackground}</Text>
            <View style={{width: 20, height: 20, backgroundColor: myContrastColorBackground}}></View>
            <Divider />
            <Text>{"darkerViewBackgroundColor: "+darkerViewBackgroundColor}</Text>
            <View style={{width: 20, height: 20, backgroundColor: darkerViewBackgroundColor}}></View>
            <Divider />
            <Text>{"myContrastColorDarkerBackground: "+myContrastColorDarkerBackground}</Text>
            <View style={{width: 20, height: 20, backgroundColor: myContrastColorDarkerBackground}}></View>
            <Divider />
            <View style={{width: "100%", height: 20, backgroundColor: viewBackgroundColor}}>
                <Text style={{color: "#000000"}}>{"contrastRatioViewBackgroundColorBlack: "+contrastRatioViewBackgroundColorBlack}</Text>
            </View>
            <Divider />
            <View style={{width: "100%", height: 20, backgroundColor: viewBackgroundColor}}>
                <Text style={{color: "#FFFFFF"}}>{"contrastRatioViewBackgroundColorWhite: "+contrastRatioViewBackgroundColorWhite}</Text>
            </View>
            <Divider />
            <View style={{width: "100%", height: 20, backgroundColor: darkerViewBackgroundColor}}>
                <Text style={{color: "#000000"}}>{"contrastRatioDarkerViewBackgroundColorBlack: "+contrastRatioDarkerViewBackgroundColorBlack}</Text>
            </View>
            <Divider />
            <View style={{width: "100%", height: 20, backgroundColor: darkerViewBackgroundColor}}>
                <Text style={{color: "#FFFFFF"}}>{"contrastRatioDarkerViewBackgroundColorWhite: "+contrastRatioDarkerViewBackgroundColorWhite}</Text>
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
