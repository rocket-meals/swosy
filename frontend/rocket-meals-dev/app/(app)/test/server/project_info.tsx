import {StyleSheet} from 'react-native';
import {Text, View} from '@/components/Themed';
import {
    useProjectColor,
    useProjectInfo,
    useProjectLogoAssetId,
    useProjectName
} from "@/states/ProjectInfo";
import {DirectusImage} from "@/components/project/DirectusImage";
import {ProjectLogo} from "@/components/project/ProjectLogo";

export default function HomeScreen() {

  const projectInfo = useProjectInfo();
  const projectName = useProjectName()
  const projectColor = useProjectColor()
    const projectLogoAssetId = useProjectLogoAssetId()

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Project Info</Text>
      <Text>{JSON.stringify(projectInfo, null, 2)}</Text>
      <Text style={styles.title}>Project Name</Text>
      <Text>{projectName}</Text>
      <Text style={styles.title}>Project Color</Text>
      <View style={{width: 40, height: 40, backgroundColor: projectColor}} />
      <Text style={styles.title}>Project Logo</Text>
        <DirectusImage assetId={projectLogoAssetId} style={{width: 40, height: 40}} />
        <ProjectLogo style={{width: 40, height: 40}} />
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
