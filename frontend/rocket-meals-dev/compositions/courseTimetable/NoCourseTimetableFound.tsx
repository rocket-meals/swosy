import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {View} from "@/components/Themed";
import {CourseTimetableAnimation} from "@/compositions/animations/CourseTimetableAnimation";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const NoCourseTimetableFound = () => {

    const translationMarkdownEmptyDescription = useTranslation(TranslationKeys.courseTimetableDescriptionEmpty);

    return (
        <View style={{
            width: "100%",
        }}>
            <ThemedMarkdown>
                {translationMarkdownEmptyDescription}
            </ThemedMarkdown>
            <CourseTimetableAnimation />
        </View>
    )
  }