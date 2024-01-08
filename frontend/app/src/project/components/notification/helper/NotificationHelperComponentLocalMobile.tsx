import React, {FunctionComponent, useEffect, useState} from "react";
import {NotificationIcon} from "../NotificationIcon";
import {NotificationHelper} from "../../../helper/notification/NotificationHelper";
import {NotificationHelperMobileTouchable} from "./NotificationHelperMobileTouchable";

export type NotificationHelperComponentProps = {
    localNotificationKey?: string;
    // async function
    getNotificationMessageObject?: () => Promise<any>;
    style?: any;
}
export const NotificationHelperComponentLocalMobile: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    const notificationKey = props.localNotificationKey || "";
    const [notification, setNotification] = useState(undefined);
    const [error, setError] = useState(undefined);
    const loading = notification === undefined;
    const active = notification !== undefined && notification !== null;
    const notificationIdentifier = notification?.identifier || "";
    //console.log("NotificationHelperComponentLocalMobile");
    //console.log("notificationKey", notificationKey);
    //console.log("notification", notification);
    //console.log("loading", loading);
    //console.log("active", active);
    //console.log("notificationIdentifier", notificationIdentifier);

    async function loadNotification(){
        let notification = null;
        try{
            notification = await NotificationHelper.getScheduleLocalNotificationByCustomIdentifier(notificationKey);
        } catch (e) {
            console.error("NotificationHelperComponentLocalMobile.loadNotification", notificationKey, e);
            setError(e);
        }
        setNotification(notification);
    }

    if(!notificationKey){
        return null;
    }

    // run useEffect to get NotificationHelper notification by custom Identifier
    useEffect(() => {
        //console.log("useEffect: loadNotification");
        loadNotification();
    }, []);

    return (
        <NotificationHelperMobileTouchable style={props?.style} onPress={async () => {
            if(active){
                NotificationHelper.cancelScheduledLocalNotification(notificationIdentifier);
            } else {
                // title, body, secondsFromNow, customIdentifier
                let notificationMessageObject = {};
                if(props?.getNotificationMessageObject){
                    notificationMessageObject = await props.getNotificationMessageObject();
                }

                const title = notificationMessageObject?.title || "title";
                const body = notificationMessageObject?.body || "body";
                const secondsFromNow = notificationMessageObject?.secondsFromNow || 10;

                NotificationHelper.scheduleLocalNotification(title, body, secondsFromNow, notificationKey);
            }
            loadNotification();
        }} >

            <NotificationIcon active={active} />
        </NotificationHelperMobileTouchable>
    )

}
