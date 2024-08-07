import {DirectusRoles} from "@/helper/database/databaseTypes/types";

export class RoleHelper {

    static isAdmin(role: DirectusRoles | null){
        if(!role){
            return false;
        }
        return !!role?.admin_access;
    }

    static isManagement(role: DirectusRoles | null){
        if(!role){
            return false;
        }
        return role.name === "Management"
    }

}