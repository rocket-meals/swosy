import {RoleHelper} from "@/helper/role/RoleHelper";
import {DirectusPermissions, DirectusRoles} from "@/helper/database/databaseTypes/types";
import {useCurrentRole, useCurrentUser} from "@/states/User";
import {useSynchedPermissionsList} from "@/states/SynchedPermissions";

export type PermissionHelperObject = {
    currentRole: DirectusRoles | null,
    permissions: DirectusPermissions[],
}

export enum PermissionActions {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    READ = "read",
}

export class PermissionHelper {

    static canCreate(permissionHelperObject: PermissionHelperObject, collection: string, field: string){
        return PermissionHelper.isFieldAllowedForAction(permissionHelperObject, collection, field, PermissionActions.CREATE);
    }

    static canUpdate(permissionHelperObject: PermissionHelperObject, collection: string, field: string){
        return PermissionHelper.isFieldAllowedForAction(permissionHelperObject, collection, field, PermissionActions.UPDATE);
    }

    static useCanCreate(collection: string, field: string){
        let permissionHelperObject = PermissionHelper.usePermissionHelperObject();
        return PermissionHelper.canCreate(permissionHelperObject, collection, field);
    }

    static usePermissionHelperObject(): PermissionHelperObject{
        const currentRole = useCurrentRole();
        const permissions = useSynchedPermissionsList();
        return {
            currentRole: currentRole,
            permissions: permissions,
        }
    }

    static filterItemForAllowedCreateFields<T extends Object>(permissionHelperObject: PermissionHelperObject, collection: string, item: Partial<T>): Partial<T>{
        const role = permissionHelperObject.currentRole;
        if(RoleHelper.isAdmin(role)){
            return item;
        }
        let fieldsOfItem = Object.keys(item);
        let filteredItem: Partial<T> = {};
        for(let field of fieldsOfItem){
            if(PermissionHelper.canCreate(permissionHelperObject, collection, field)){
                // @ts-ignore
                filteredItem[field] = item[field];
            }
        }
        return filteredItem;
    }

    static useCanUpdate(collection: string, field: string){
        let permissionHelperObject = PermissionHelper.usePermissionHelperObject();
        return PermissionHelper.canUpdate(permissionHelperObject, collection, field);
    }

    static filterItemForAllowedUpdateFields<T>(permissionHelperObject: PermissionHelperObject, collection: string, item: Partial<T>): Partial<T>{
        const role = permissionHelperObject.currentRole;
        if(RoleHelper.isAdmin(role)){
            return item;
        }
        let fieldsOfItem = Object.keys(item);
        let filteredItem: Partial<T> = {};
        for(let field of fieldsOfItem){
            if(PermissionHelper.canUpdate(permissionHelperObject, collection, field)){
                // @ts-ignore
                filteredItem[field] = item[field];
            }
        }
        return filteredItem;
    }



    static isFieldAllowedForAction(permissionHelperObject: PermissionHelperObject, collection: string, field: string, action: PermissionActions){
        const role = permissionHelperObject.currentRole;
        const permissions = permissionHelperObject.permissions;

        if(RoleHelper.isAdmin(role)){
            return true;
        }

        //const rolePublic = null;

        if(!!permissions && permissions.length>=0){
            for(let permission of permissions){
                let collectionInPermission = permission.collection;
                let permissionsAction = permission.action;
                let fields = permission.fields;
                const isSameCollection = collectionInPermission===collection;
                const isSameAction = permissionsAction===action;

                let roleForPermission = null;
                if(!!role && !!role.id){
                    roleForPermission = role.id;
                }
                const isSameRole = roleForPermission===permission.role;

                if(isSameCollection && isSameAction && isSameRole && !!fields){
                    const fieldsAsArray = fields as string[] || [];
                    if(fieldsAsArray.includes(field) || fieldsAsArray.includes("*")){
                        return true;
                    }
                }
            }
        }
        return false;
    }


}
