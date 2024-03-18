import {RoleHelper} from "@/helper/role/RoleHelper";
import {DirectusPermissions, DirectusRoles} from "@/helper/database/databaseTypes/types";
import {useCurrentRole, useCurrentUser} from "@/states/User";
import {useSynchedPermissionsList} from "@/states/SynchedPermissions";

export class PermissionHelper {

    static canCreate(collection: string, field: string, role: DirectusRoles | null, permissions: DirectusPermissions[]){
        return PermissionHelper.isFieldAllowedForAction(role, permissions, collection, field, "create");
    }

    static canUpdate(collection: string, field: string, role: DirectusRoles | null, permissions: DirectusPermissions[]){
        return PermissionHelper.isFieldAllowedForAction(role, permissions, collection, field, "update");
    }

    static isAdmin(role: DirectusRoles){
        return RoleHelper.isAdmin(role);
    }

    static useCanCreate(collection: string, field: string){
        const currentRole = useCurrentRole();
        const permissions = useSynchedPermissionsList();
        return PermissionHelper.canCreate(collection, field, currentRole, permissions);
    }

    static useCanUpdate(collection: string, field: string){
        const currentRole = useCurrentRole();
        const permissions = useSynchedPermissionsList();
        return PermissionHelper.canUpdate(collection, field, currentRole, permissions);
    }

    static isFieldAllowedForAction(role: DirectusRoles | null, permissions: DirectusPermissions[], collection: string, field: string, action: string){
        if(role && RoleHelper.isAdmin(role)){
            return true;
        }

        const rolePublic = null;

        if(!!permissions && permissions.length>=0){
            for(let permission of permissions){
                let collectionInPermission = permission.collection;
                let permissionsAction = permission.action;
                let fields = permission.fields;
                if(collectionInPermission===collection && permissionsAction===action && !!fields){
                    const fieldsAsArray = fields as string[] || [];
                    if(fieldsAsArray.includes(field) || fieldsAsArray.includes("*")){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static filterForAllowedUpdateFields(role, permissions, collection, item){
        if(RoleHelper.isAdmin(role)){
            return item;
        }

        let fieldsOfItem = Object.keys(item);
        let filteredItem = {};

        if(!!permissions && permissions.length>=0){
            for(let permission of permissions){
                let collectionInPermission = permission.collection;
                let action = permission.action;
                let fields = permission.fields;
                if(collectionInPermission===collection && action==="update"){
                    for(let field of fieldsOfItem){
                        if(fields.includes(field) || fields.includes("*")){
                            filteredItem[field] = item[field];
                        }
                    }
                }
            }
        }
        return filteredItem;

    }

}
