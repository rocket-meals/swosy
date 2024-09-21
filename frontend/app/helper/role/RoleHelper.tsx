import {PermissionHelperObject} from "@/helper/permission/PermissionHelper";

export class RoleHelper {

    static isAdmin(permissionHelperObject: PermissionHelperObject){
        return permissionHelperObject.admin_access;
    }

    static isManagement(permissionHelperObject: PermissionHelperObject){
        let role = permissionHelperObject.currentRole;
        if(!role){
            return false;
        }
        return role.name === "Management"
    }

}