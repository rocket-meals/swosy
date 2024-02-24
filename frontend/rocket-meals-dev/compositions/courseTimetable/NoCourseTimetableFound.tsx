import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {View, Text} from "@/components/Themed";
import {CourseTimetableAnimation} from "@/compositions/animations/CourseTimetableAnimation";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export default function CourseTimetableScreen() {

    const translationMarkdownEmptyDescription = useTranslation(TranslationKeys.courseTimetableDescriptionEmpty);

    function renderAnimation(){
        return (
            <MyScrollView>
                <View style={{
                    width: "100%",
                    flex: 1
                }}>
                    <ThemedMarkdown>
                        {translationMarkdownEmptyDescription}
                    </ThemedMarkdown>
                    <CourseTimetableAnimation />
                </View>
            </MyScrollView>
        )
    }


      return (
          <MySafeAreaView>
                {renderAnimation()}
          </MySafeAreaView>
      );
  }