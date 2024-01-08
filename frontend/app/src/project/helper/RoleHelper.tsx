import {DirectusRoles} from "../directusTypes/types";

export class RoleHelper {

    static isAdmin(role: DirectusRoles){
        return !!role?.admin_access;
    }

    static isEmployee(role: DirectusRoles){
        return role.name === "Mitarbeiter"
    }

}