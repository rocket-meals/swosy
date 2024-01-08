import {RoleHelper} from "./RoleHelper";
import {ConfigHolder} from "../../kitcheningredients";

export class PermissionHelper {

    static canCreate(collection, field){
        let permissions = ConfigHolder.instance.getPermissions();
        let role = ConfigHolder.instance.getRole();
        return PermissionHelper.isFieldAllowedForAction(role, permissions, collection, field, "create");
    }

    static canUpdate(collection, field){
        let permissions = ConfigHolder.instance.getPermissions();
        let role = ConfigHolder.instance.getRole();
        return PermissionHelper.isFieldAllowedForAction(role, permissions, collection, field, "update");
    }

    static isAdmin(){
        let role = ConfigHolder.instance.getRole();
        return RoleHelper.isAdmin(role);
    }

    static isFieldAllowedForAction(role, permissions, collection, field, action){
        if(RoleHelper.isAdmin(role)){
            return true;
        }

        if(!!permissions && permissions.length>=0){
            for(let permission of permissions){
                let collectionInPermission = permission.collection;
                let permissionsAction = permission.action;
                let fields = permission.fields;
                if(collectionInPermission===collection && permissionsAction===action){
                    if(fields.includes(field) || fields.includes("*")){
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
