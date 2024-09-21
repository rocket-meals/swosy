import {RoleHelper} from "@/helper/role/RoleHelper";
import {
    DirectusAccess,
    DirectusPermissions,
    DirectusPolicies,
    DirectusRoles
} from "@/helper/database/databaseTypes/types";
import {useCurrentRole} from "@/states/User";
import {useSynchedRolesDict} from "@/states/SynchedRoles";
import {useSynchedPoliciesDict} from "@/states/SynchedPolicies";

export type PermissionHelperObject = {
    currentRole: DirectusRoles | null,
    rolesDict?: Record<string, DirectusRoles | null | undefined> | null | undefined,
    admin_access: boolean,
    policiesDict?: Record<string, DirectusPolicies | null | undefined> | null | undefined,
    permissionsForCurrentRole: DirectusPermissions[],
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

    static getAllPoliciesIdsForCurrentRole(currentRole: DirectusRoles | null, policiesDict: Record<string, DirectusPolicies | null | undefined> | null | undefined, rolesDict: Record<string, DirectusRoles | null | undefined> | null | undefined, alreadyVisitedRoles: string[] = []): string[]{
        const currentRoleId = currentRole?.id;
        const poliesForRole = []
        for(let policyId in policiesDict){
            const policy = policiesDict[policyId];
            let rolesRelationsForPolicy: DirectusAccess[] = policy?.roles || [];
            for(let roleRelation of rolesRelationsForPolicy){
                const roleRelationRole = roleRelation.role as string | null | undefined;
                if(!roleRelationRole){
                    // policy is for all roles - public policy
                    poliesForRole.push(policyId);
                } else {
                    if(roleRelationRole===currentRoleId){
                        poliesForRole.push(policyId);
                    }
                }
            }
        }

        if(!!currentRoleId){
            alreadyVisitedRoles.push(currentRoleId);
        }
        let parentRoleId: string | null | undefined = null;
        const currentRoleParent = currentRole?.parent;
        if(currentRoleParent){
            if(typeof currentRoleParent === "string") {
                parentRoleId = currentRoleParent;
            } else {
                parentRoleId = currentRoleParent.id;
            }
        }
        if(!!parentRoleId && !alreadyVisitedRoles.includes(parentRoleId)){
            const parentRole = rolesDict?.[parentRoleId];
            if(!!parentRole){
                const poliesForParentRole = PermissionHelper.getAllPoliciesIdsForCurrentRole(parentRole, policiesDict, rolesDict, alreadyVisitedRoles);
                for(let policyId of poliesForParentRole){
                    poliesForRole.push(policyId);
                }
            }
        }

        return poliesForRole;
    }

    static usePermissionHelperObject(): PermissionHelperObject{
        console.log("usePermissionHelperObject");
        const currentRole = useCurrentRole();
        console.log("currentRole", currentRole);
        const [rolesDict, setRolesDict] = useSynchedRolesDict();
        console.log("rolesDict", rolesDict);
        const [policiesDict, setPoliciesDict] = useSynchedPoliciesDict();
        console.log("policiesDict", policiesDict);
        const policiesIdsForCurrentRole = PermissionHelper.getAllPoliciesIdsForCurrentRole(currentRole, policiesDict, rolesDict);
        console.log("policiesIdsForCurrentRole", policiesIdsForCurrentRole);
        const policiesForCurrentRole = []
        for(let policyId of policiesIdsForCurrentRole){
            const policy = policiesDict?.[policyId];
            if (!!policy) {
                policiesForCurrentRole.push(policy);
            }
        }
        console.log("policiesForCurrentRole", policiesForCurrentRole);
        let admin_access = false;
        for(let policy of policiesForCurrentRole){
            if(policy?.admin_access){
                admin_access = true;
                break;
            }
        }
        console.log("admin_access", admin_access);
        const permissionsForCurrentRole = []
        for(let policy of policiesForCurrentRole){
            const permissions = policy?.permissions || [];
            for(let permission of permissions){
                permissionsForCurrentRole.push(permission);
            }
        }


        return {
            currentRole: currentRole,
            rolesDict: rolesDict,
            policiesDict: policiesDict,
            admin_access: admin_access,
            permissionsForCurrentRole: permissionsForCurrentRole,
        }
    }

    static filterItemForAllowedCreateFields<T extends Object>(permissionHelperObject: PermissionHelperObject, collection: string, item: Partial<T>): Partial<T>{
        const role = permissionHelperObject.currentRole;
        if(RoleHelper.isAdmin(permissionHelperObject)){
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
        if(RoleHelper.isAdmin(permissionHelperObject)){
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
        console.log("isFieldAllowedForAction", collection, field, action);
        const role = permissionHelperObject.currentRole;
        const permissions = permissionHelperObject.permissionsForCurrentRole;

        if(RoleHelper.isAdmin(permissionHelperObject)){
            return true;
        }

        if(!!permissions && permissions.length>=0){
            for(let permission of permissions){
                let collectionInPermission = permission.collection;
                let permissionsAction = permission.action;
                let fields = permission.fields;
                const isSameCollection = collectionInPermission===collection;
                const isSameAction = permissionsAction===action;

                if(isSameCollection && isSameAction && !!fields){
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
