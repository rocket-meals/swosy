import {StyleSheet} from 'react-native';
import {View, Text} from "@/components/Themed";
import {LegalRequiredLinks} from "@/components/legal/LegalRequiredLinks";

export default function ScreenPrivacyPolicy() {

    return (
        <View>
            <Text>{"Here comes privacy policy"}</Text>
            <LegalRequiredLinks />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: '#2e78b7',
    },
});
