import React from "react";
import {SettingsRowTextEdit, SettingsRowTextEditProps} from "@/components/settings/SettingsRowTextEdit";
import {StringHelper} from "@/helper/string/StringHelper";

export const SettingsRowTimeEdit = ({onSave, placeholder, ...props}: SettingsRowTextEditProps) => {

    const placeholderUsed = placeholder || "HH:MM";

    async function usedOnSave(value: string | undefined | null, hide: () => void){
        // check if input is valid time format (hh:mm) and format it
        // if not, return false
        if(value){
            // check if format is hh:mm
            let time = value.split(":");
            if(time.length == 1){
                let hoursString = time[0];
                // check if hours is a number
                if(!StringHelper.isNumber(hoursString)){
                    let hours = parseInt(hoursString);
                    // check if hours is in range
                    if(hours >= 0 && hours <= 23){
                        value = hours + ":00";
                        return onSave(value, hide);
                    }
                }
            } else if(time.length == 2){
                //check if hours and minutes are numbers
                let hoursString = time[0];
                let minutesString = time[1];
                if(StringHelper.isNumber(hoursString) && StringHelper.isNumber(minutesString)){
                    let hours = parseInt(hoursString);
                    let minutes = parseInt(minutesString);
                    //check if hours and minutes are in range
                    if(hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59){
                        return onSave(value, hide);
                    }
                }
            }
        }
        return false;
    }

    return(
        <SettingsRowTextEdit placeholder={placeholderUsed} onSave={usedOnSave} {...props} />
    )
}
