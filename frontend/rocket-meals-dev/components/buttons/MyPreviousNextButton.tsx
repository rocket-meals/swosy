import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export type MyPreviousNextButtonProps = {
    forward: boolean,
    translation: string,
    onPress?: (forward: boolean) => void
    useTransparentBorderColor?: boolean,
}
export const MyPreviousNextButton = (props: MyPreviousNextButtonProps) => {
    const forward = props.forward;
    const iconName = forward ? "chevron-right" : "chevron-left";
    const translation_next = useTranslation(TranslationKeys.next);
    const translation_previous = useTranslation(TranslationKeys.previous);
    const translation = props.translation;

    let usedTranslation = translation;
    if(forward){
        usedTranslation += ": " + translation_next;
    } else {
        usedTranslation += ": " + translation_previous;
    }

    return <MyButton useTransparentBorderColor={props?.useTransparentBorderColor} tooltip={usedTranslation} useOnlyNecessarySpace={true} leftIcon={iconName} accessibilityLabel={usedTranslation} onPress={() => {
        if(props?.onPress){
            props?.onPress(forward);
        }
    }} />
}