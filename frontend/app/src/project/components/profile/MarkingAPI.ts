import {FoodoffersMarkings, FoodsMarkings, Markings, ProfilesMarkings} from "../../directusTypes/types";
import {useSynchedProfile} from "./ProfileAPI";
import {useSynchedMarkingsDict} from "../../helper/synchedJSONState";

const FIELD_MARKINGS_ID = "markings_id";

function useSynchedProfileMarkings(): ProfilesMarkings[] {
    const [profile, setProfile] = useSynchedProfile();
    // @ts-ignore
    return profile?.markings || [];
}

export function useSynchedProfileMarking(marking_id: number): [profileMarking: ProfilesMarkings, setDislikes: (dislikes: boolean) => any, removeProfileMarking: () => any] {
    const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
    let profileMarking = profilesMarkingsDict[marking_id];

    const setProfileMarkingDislikes = (dislikes: boolean) => {
        setProfileMarking(marking_id, dislikes);
    }

    const removeProfileMarkingSingle = () => {
        removeProfileMarking(marking_id);
    }

    return [
        profileMarking, setProfileMarkingDislikes, removeProfileMarkingSingle
    ]
}

export function useSynchedProfileMarkingsDict(): [value: {[key: string]: ProfilesMarkings}, setProfileMarking: (markingId: number, dislikes: boolean) => any, removeProfileMarking: (markingId: number) => any] {
    const [profile, setProfile] = useSynchedProfile();

    const markings = useSynchedProfileMarkings();
    let profilesMarkingsDict = {};
    if(!!markings){
        for(let marking of markings){
            profilesMarkingsDict[marking?.[FIELD_MARKINGS_ID]] = marking;
        }
    }

    const privateSetMarkings = (markingId: number, dislikes: boolean, remove: boolean) => {
        let markingsDictCopy = JSON.parse(JSON.stringify(profilesMarkingsDict));
        markingsDictCopy[markingId] = {[FIELD_MARKINGS_ID]: markingId, profiles_id: profile?.id, dislikes: !!dislikes};
        if(remove){
            delete markingsDictCopy[markingId];
        }

        let markingsIds = Object.keys(markingsDictCopy);
        let newMarkings = [];
        for(let markingId of markingsIds){
            newMarkings.push(markingsDictCopy[markingId]);
        }
        // @ts-ignore
        profile.markings = newMarkings;
        setProfile(profile);
    }

    const setProfileMarking = (markingId: number, dislikes: boolean) => {
        privateSetMarkings(markingId, dislikes, false);
    }

    const removeProfileMarking = (markingId: number) => {
        privateSetMarkings(markingId, false, true);
    }

    return [
        profilesMarkingsDict, setProfileMarking, removeProfileMarking
    ]
}

export function countDislikedMarkings(markings, ownMarkingsDict){
    return getDislikedMarkings(markings, ownMarkingsDict).length;
}

export function getDislikedMarkings(markings: Markings[], ownMarkingsDict){
    let dislikedMarkings = [];
    if(!!markings){
        for(let marking of markings){
            let dislikeValue = ownMarkingsDict[marking?.id]?.dislikes;
            if(dislikeValue==="true" || dislikeValue===true){
                dislikedMarkings.push(marking);
            }
        }
    }
    return dislikedMarkings;
}

export function useMarkingsFromFoodofferMarkings(foodoffer_markings: FoodoffersMarkings[] | FoodsMarkings[], allMarkingsDictPassed?){
    let usedAllMarkingsDict = allMarkingsDictPassed;
    if(!usedAllMarkingsDict){
        const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();
        usedAllMarkingsDict = allMarkingsDict;
    }

    let markings = [];
    if(!!foodoffer_markings){
        for(let foodoffer_marking of foodoffer_markings){
            let marking_id = foodoffer_marking?.[FIELD_MARKINGS_ID];
            if(!!marking_id){
                markings.push(usedAllMarkingsDict[marking_id]);
            }
        }
    }
    return markings;
}

export function countLikedMarkings(markings, ownMarkingsDict){
    let count = 0;
    if(!!markings){
        for(let marking of markings){
            let dislikeValue = ownMarkingsDict[marking?.[FIELD_MARKINGS_ID]]?.dislikes;
            if(dislikeValue==="false" || dislikeValue===false){
                count++;
            }
        }
    }
    return count;
}
