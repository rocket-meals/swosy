import React, {FunctionComponent, useState} from "react";
import {Divider, ScrollView, Text, useToast, View} from "native-base";
import {BaseNoScrollTemplate} from "../../../kitcheningredients";
import {useSynchedChatroomsDict} from "../../helper/synchedJSONState";
import {useMyFocusHandler} from "../../helper/useMyFocusHandler";
import {RefreshControl} from "react-native";
import {MyReloadButton} from "../../components/buttons/MyReloadButton";
import {Conversation} from "./Conversation";
import {DateHelper} from "../../helper/DateHelper";
import {StringHelper} from "../../helper/StringHelper";
import {ConversationHelper} from "../../components/conversations/ConversationHelper";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {SettingsRowNavigator} from "../../components/settings/SettingsRowNavigator";
import {ConversationsHeader} from "../../components/conversations/ConversationsHeader";

export const Conversations: FunctionComponent = (props) => {

    const [chatroomsDict, setChatroomsDict] = useSynchedChatroomsDict();
    const reloadAllChatrooms = ConversationHelper.useReloadAllChatrooms()
    const toast = useToast();

    const translationReload = useAppTranslation("reload");
    const translationSuccess = useAppTranslation("success");
    const translationError = useAppTranslation("error");

    const translationConversation = useAppTranslation("conversation")

    const [refreshing, setRefreshing] = React.useState(false);

    const [counter, setCounter] = useState(0)

    const amountOfLines = 2;

    useMyFocusHandler(() => { // This is called when the tab/app is focused
        setCounter(counter+1);
        //TODO:
        // reload Chatrooms?
    }, [])

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try{
            await reloadAllChatrooms();
            toast.show({
                description: translationReload+": "+translationSuccess
            });
        } catch (err){
            toast.show({
                description: translationError
            });
        }
        setRefreshing(false);
    }, []);

    function renderSpacer(){
        let spacer = [];
        for(let i=0; i<amountOfLines; i++){
            spacer.push(<Text>{StringHelper.EMPTY_SPACE}</Text>)
        }
        return 	<View style={{opacity: 0}}>
            {spacer}
        </View>;
    }

    function renderConversationPreview(id){
        let chatroom = ConversationHelper.useChatroom(id);
        let chatroom_messages = chatroom?.messages;
        let topicTitle = ConversationHelper.useChatroomTopicTitleByChatroomId(id)

        let chatroom_messages_last = chatroom_messages?.[chatroom_messages?.length-1];
        let chatroom_messages_last_text = chatroom_messages_last?.textarea || "";
        let last_text_without_line_break = StringHelper.replaceAllLineBreaks(chatroom_messages_last_text, " ");
        let chatroom_messages_last_text_date_created = chatroom_messages_last?.date_created;

        let renderedDate = DateHelper.formatOfferDateToReadable(chatroom_messages_last_text_date_created, true);

        let content = (
            <View style={{width: "100%", flexDirection: "row"}}>
                <View style={{flex: 1}}>
                    <View style={{width: "100%"}}>
                        <Text bold={true} numberOfLines={1}>{topicTitle}</Text>
                    </View>
                    <View style={{width: "100%", flexDirection: "row"}}>
                        {renderSpacer()}
                        <Text numberOfLines={amountOfLines}>{last_text_without_line_break}</Text>
                    </View>
                </View>
                <View style={{justifyContent: "flex-start"}}>
                    <View>
                        <Text fontSize={"sm"} italic={true} numberOfLines={1}>
                            {renderedDate}
                        </Text>
                    </View>
                </View>
            </View>
        )

        return (
            <SettingsRowNavigator destinationComponent={Conversation} accessibilityLabel={translationConversation} destinationParams={{id: id}} leftContent={content} />
        )
    }

    function renderConversations(){
        let ids = Object.keys(chatroomsDict);
        let output = [];
        for(let i=ids.length-1; i>=0; i--){
            let id = ids[i];
            output.push(renderConversationPreview(id));
            output.push(<Divider/>)
        }
        return(
            output
        )
    }

    return (
      <BaseNoScrollTemplate route={props?.route} header={<ConversationsHeader route={props.route} refreshing={refreshing} onRefresh={onRefresh} />} >
          <View style={{width: "100%", height: "100%"}}>
              <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} >
                  {renderConversations()}
              </ScrollView>
          </View>
      </BaseNoScrollTemplate>
  )
}
