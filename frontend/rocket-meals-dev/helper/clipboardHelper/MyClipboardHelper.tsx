import {useToast} from "@gluestack-ui/themed";
import { Clipboard } from 'react-native';
import {useState} from "react";
import {View, Text, useViewBackgroundColor} from "@/components/Themed";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

function useClipboard() {
    const [hasCopied, setHasCopied] = useState(false);
    const [value, setValue] = useState<string>('');
    const onCopy = async (copiedValue: string) => {
        if (Clipboard) {
            await Clipboard.setString(copiedValue);
        }
        setValue(copiedValue);
        setHasCopied(true);
    };
    return {
        value,
        onCopy,
        hasCopied,
    };
}

export const useMyClipboard = () => {
    const clipboard = useClipboard();
    const toast = useToast();
    const viewBackgroundColor = useViewBackgroundColor()
    const lighterOrDarkerBackgroundColor = useLighterOrDarkerColorForSelection(viewBackgroundColor)
    const lighterOrDarkerTextColor = useMyContrastColor(lighterOrDarkerBackgroundColor)
    const translation_copied = useTranslation(TranslationKeys.copied)

    const copyText = async (text: string | undefined | null) => {
        await clipboard.onCopy(text || "");
        toast.show({
            placement: "top",
            render: () => {
                return <View style={{
                    backgroundColor: lighterOrDarkerBackgroundColor,
                    padding: 10,
                    borderRadius: 5,
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <Text style={{
                        color: lighterOrDarkerTextColor
                    }}>{translation_copied}</Text>
                </View>
            }
        });
    }
    return {
        copyText
    }
}
