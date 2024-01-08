// @ts-nocheck
import React, {FunctionComponent} from "react";
import {useSynchedChatroomsDict, useSynchedChatroomTopicsDict} from "../../helper/synchedJSONState";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {SyncCollectionLoader} from "../../helper/syncAndSetup/SyncCollectionLoader";
import {CollectionHelper} from "../../helper/CollectionHelper";

export class ConversationHelper{

    static useChatroom(chatroom_id){
        const [chatroomsDict, setChatroomsDict] = useSynchedChatroomsDict();
        return chatroomsDict?.[chatroom_id];
    }

    static useReloadAllChatrooms(){
        const [chatroomsDict, setChatroomsDict] = useSynchedChatroomsDict();
        return () => ConversationHelper.loadAllChatrooms(chatroomsDict, setChatroomsDict);
    }

    static useChatroomTopicTitleByChatroomId(id){
        const chatroom = ConversationHelper.useChatroom(id);
        let chatroom_messages = chatroom?.messages;
        let chatroomTopicId = chatroom?.topic;
        return ConversationHelper.useChatroomTopicTitleByTopicId(chatroomTopicId);
    }


    static useChatroomTopicTitleByTopicId(topic_id){
        const [chatroomTopicsDict, setChatroomTopicsDict] = useSynchedChatroomTopicsDict();
        let chatroomTopic = chatroomTopicsDict?.[topic_id];
        let chatroomTopicTranslations = chatroomTopic?.translations;
        let topicTitle = useDirectusTranslation(chatroomTopicTranslations, "content", null, "Title");
        return topicTitle;
    }

    static getChatroomsTablename(){
        return "chatrooms";
    }

    static getChatroomMessagesTablename(){
        return "chatroom_messages";
    }

    static async loadAllChatrooms(chatroomsDict, setChatroomsDict){
        await SyncCollectionLoader.setCacheOfRemoteCollection(ConversationHelper.getChatroomsTablename(), chatroomsDict, setChatroomsDict, SyncCollectionLoader.getFieldsForAllAndTranslations(["messages.*"]), CollectionHelper.transformCollectionToDict, ["-date_updated"], 100, 0);
    }

    static getDemoDict() {
        let amountDemoConversations = 10;
        let demoConversations = {}
        for (let i = 1; i <= amountDemoConversations; i++) {
            demoConversations[i] = ConversationHelper.getDemoConversation(i);
        }
        return demoConversations;
    }


    static getDemoConversation(id){
        return({
                "id": id,
                "status": "draft",
                "sort": null,
                "user_created": "294e2f5d-3508-4c8f-9120-3921d3bbb601",
                "date_created": "2023-01-31T16:11:40.523Z",
                "user_updated": null,
                "date_updated": null,
                "owner": null,
                "topic": ConversationHelper.getDemoChatroomTopic(id),
                "messages": ConversationHelper.getDemoMessages()
            }
        )
    }

    static getDemoChatroomTopic(conversation_id){
        return conversation_id%3;
    }

    static getDemoMessages(){
        let amountDemoMessages = 10;
        let demoMessages = []
        for (let i = 1; i <= amountDemoMessages; i++) {
            demoMessages.push(ConversationHelper.getDemoMessage(i));
        }
        return demoMessages;
    }

    static getDemoMessage(id){
        return(
            {
                "id": id,
                "status": "draft",
                "sort": null,
                "user_created": "294e2f5d-3508-4c8f-9120-3921d3bbb601",
                "date_created": "2023-03-02T13:33:14.531Z",
                "user_updated": null,
                "date_updated": null,
                "chatroom": 1,
                "textarea": ConversationHelper.getDemoMessageTextarea(id)
            }
        )
    }

    static getDemoMessageTextarea(id){
        let lineText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vitae aliquam lacinia, nisl nisl aliquam nisl.";

        if(id%3==0){
            // return a long text with linebreaks
            return lineText + "\n"+lineText + "\n"+lineText+ "\n"+lineText+ "\n"+lineText
        }
        else if(id%2==0){
            // return a long text without linebreaks
            return lineText + lineText
        } else{
            // return a short text
            return lineText
        }
    }

}
