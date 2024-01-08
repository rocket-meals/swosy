import React, {FunctionComponent, useCallback, useEffect, useRef, useState} from "react";
import {Divider, ScrollView, Spinner, Text, View} from "native-base";
import {BaseNoScrollTemplate, BasePadding, BaseTemplate, Icon, ServerAPI, useThemeTextColor} from "../../../kitcheningredients";
import {useDemoMode, useSynchedChatroomsDict} from "../../helper/synchedJSONState";
import {ConversationHelper} from "../../components/conversations/ConversationHelper";
import Rectangle from "../../helper/Rectangle";
import {DateHelper} from "../../helper/DateHelper";
import {MyTouchableOpacity} from "../../components/buttons/MyTouchableOpacity";
import {TextInputGrowing} from "../../components/inputs/TextInputGrowing";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {ConversationMessage} from "./ConversationMessage";
import {FoodListHeader} from "../../components/food/FoodListHeader";
import {FoodCardListComponent} from "../../components/food/FoodCardListComponent";
import {NotFound} from "../animations/NotFound";
import {NoFoodOffersFound} from "../../components/food/NoFoodOffersFound";

export const ConversationComponent: FunctionComponent = (props) => {

    const [demo, setDemo] = useDemoMode();

    // Gifted-Chat is not working: https://www.npmjs.com/package/react-native-gifted-chat

    const id = props?.route?.params?.id;

    const scrollViewRef = useRef();

    const reloadAllChatrooms = ConversationHelper.useReloadAllChatrooms()
    const chatroom = ConversationHelper.useChatroom(id);
    const chatroomID = chatroom?.id;
    const chatroom_messages = chatroom?.messages || []

    const directus = ServerAPI.getClient();

    const textColor = useThemeTextColor();

    const placeholder = useAppTranslation("conversationWriteAMessage");

    const [startedAtBottom, setStartedAtBottom] = useState(false);
    const [textValue, setTextValue] = useState("");
    const [reloadNumber, setReloadNumber] = useState(0);

    let [pending_chatroom_messages_dict, set_pending_chatroom_messages_dict] = useState({});
    let [currently_sending_message_key, setCurrentlySendingMessage_key] = useState(undefined);

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

    useEffect(() => {
        const sendMessages = async () => {
            if(!currently_sending_message_key){ // we lock our action, so writing two messages fast wont clash
                let pendingKeys = Object.keys(pending_chatroom_messages_dict || {});
                try {
                    let firstPendingMessageKeyWhichIsUnfailed = null;
                    for(let i=0; i<pendingKeys.length && !firstPendingMessageKeyWhichIsUnfailed; i++){
                        let pendingKey = pendingKeys[0];
                        let pendingMessage = pending_chatroom_messages_dict[pendingKey];
                        if(isPendingMessageNotFailed(pendingMessage)){
                            firstPendingMessageKeyWhichIsUnfailed = pendingKey;
                            break;
                        }
                    }
                    setCurrentlySendingMessage_key(firstPendingMessageKeyWhichIsUnfailed);
                    if(firstPendingMessageKeyWhichIsUnfailed){
                        let firstPendingMessageWhichIsUnfailed = JSON.parse(JSON.stringify(pending_chatroom_messages_dict[firstPendingMessageKeyWhichIsUnfailed]));

                        let result = await directus.items(ConversationHelper.getChatroomMessagesTablename()).createOne({
                            textarea: firstPendingMessageWhichIsUnfailed.textarea,
                            chatroom: chatroomID
                        })

                        let copy_pending_chatroom_messages_dict = JSON.parse(JSON.stringify(pending_chatroom_messages_dict))
                        if(!!result){ //on success creation
                            // we dont add the newCreated message directly, since maybe someone else create a message to. Instead we will reload all chatmessages
                            delete copy_pending_chatroom_messages_dict[firstPendingMessageKeyWhichIsUnfailed];
                        } else { // on failed creation
                            firstPendingMessageWhichIsUnfailed.failed = true;
                            copy_pending_chatroom_messages_dict[firstPendingMessageKeyWhichIsUnfailed] = firstPendingMessageWhichIsUnfailed;
                        }

                        set_pending_chatroom_messages_dict(copy_pending_chatroom_messages_dict) // we want to trigger a reload of the useEffect function. Maybe the user wrote already another message we need to send

                        await reloadAllChatrooms(); // we will reload the chat, since maybe someone else postet it
                    }
                    setCurrentlySendingMessage_key(undefined);
                } catch (error) {
                    console.error('Failed to send messages', error);
                }
            }
        };

        sendMessages();
    }, [JSON.stringify(pending_chatroom_messages_dict), currently_sending_message_key]);


    function isPendingMessageNotFailed(message){
        return !message?.failed;
    }

    function renderMessages(){
        let output = [];
        for(let i=0; i<chatroom_messages.length; i++){
            const message = chatroom_messages[i];
            output.push(<ConversationMessage message={message} />)
        }
        let pendingKeys = Object.keys(pending_chatroom_messages_dict);
        for(let i=0; i<pendingKeys.length; i++){
            let pendingKey = pendingKeys[i];
            let message = pending_chatroom_messages_dict[pendingKey];
            output.push(<ConversationMessage message={message} />);
        }
        return output;
    }

    const submitMessage = useCallback(() => {
        let currentMessage = ""+textValue; // make a message copy
        resetTextInput();
        addMessageAsPending(currentMessage);
    }, [textValue])

    function addMessageAsPending(currentMessage){
        let date = new Date();
        let newMessage = {
            textarea: currentMessage,
            pending: true,
            date_created: date
        }
        let copy_pending_chatroom_messages_dict = JSON.parse(JSON.stringify(pending_chatroom_messages_dict))
        copy_pending_chatroom_messages_dict[date.toISOString()] = newMessage
        set_pending_chatroom_messages_dict(copy_pending_chatroom_messages_dict);
    }

    function resetTextInput(){
        setReloadNumber(reloadNumber+1);
    }

    function renderTextInput(){
        return(
            <View style={{width: "100%", flexDirection: "row", borderRadius: 20, borderWidth: 1, borderColor: textColor}}>
                <View style={{flex: 1, padding: 8, overflow: "hidden"}}>
                    <TextInputGrowing disabled={demo} placeholder={placeholder} key={reloadNumber} onChangeText={(text) => {
                        setTextValue(text)
                        return true;
                    }} />
                </View>
                <View style={{justifyContent: "center", alignItems: "flex-start", paddingLeft: 8, paddingRight: 8}}>
                    <MyTouchableOpacity disabled={demo} onPress={submitMessage} accessibilityLabel={"send"} >
                        <View><Icon name={"send"} /></View>
                    </MyTouchableOpacity>
                </View>
            </View>
        )
    }

  return (
      <BasePadding>
          <ScrollView style={{width: "100%"}}
                      ref={scrollViewRef}
                      onContentSizeChange={() => {
                          if(!startedAtBottom){
                              scrollViewRef?.current?.scrollToEnd({ animated: false })
                              setStartedAtBottom(true);
                          }
                      }}
          >
              {renderMessages()}
          </ScrollView>
          {renderTextInput()}
      </BasePadding>
  )
}
