export class DuplicatePermissionHelper{
		// as permissions can have duplicate entries, we define a duplicate as a permission with the same role, collection and action
		static getComposedKey(permission: any) {
			const composedKeyFields = ["role", "collection", "action"]
			return composedKeyFields.map(field => permission?.[field]).join("-");
		}

		static findDuplicates(permissions: any[]){
			const uniquePermissions: {[key: string]: any} = {};
			const duplicates = [];
			for(let i = 0; i < permissions.length; i++) {
				const permission = permissions[i];
				const key = this.getComposedKey(permission);
				if(uniquePermissions[key]) {
					duplicates.push(permission);
				} else {
					uniquePermissions[key] = permission;
				}
			}
			return duplicates;
		}
}
