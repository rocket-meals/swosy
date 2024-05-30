// small jest test
import {describe, expect, it} from '@jest/globals';
import {DuplicatePermissionHelper} from "../DuplicatePermissionHelper";

describe("Duplicate Permission Test", () => {
    // have at least 1 valid permission in order to test
    it("Have atleast 1 valid permission", () => {
        let permissions = getValidPermissions();
        expect(permissions.length).toBeGreaterThan(0);
    });

    // valid permissions should not have duplicates
    it("Valid permissions should not have duplicates", () => {
        let permissions = getValidPermissions();
        let duplicates = DuplicatePermissionHelper.findDuplicates(permissions);
        expect(duplicates.length).toBe(0);
    });

    // duplicated permissions should have duplicates
    it("Duplicated permissions should have duplicates", () => {
        let permissions = getPermissionsWithDuplicates();
        let duplicates = DuplicatePermissionHelper.findDuplicates(permissions);
        expect(duplicates.length).toBeGreaterThan(0);
    });

});

function getPermissionsWithDuplicates(){
    let validPermissions = getValidPermissions();
    let duplicatedPermissions = validPermissions
    // add duplicates from random valid permissions
    if(duplicatedPermissions.length>0){
        const amountOfDuplicates = 5;
        for(let i=0; i<amountOfDuplicates; i++){
            const randomIndex = Math.floor(Math.random() * duplicatedPermissions.length);
            const randomPermission = duplicatedPermissions[randomIndex];
            if(!!randomPermission){
                duplicatedPermissions.push(randomPermission);
            }
        }
    }
    return duplicatedPermissions;
}

function getValidPermissions(){
    return [
            {
                "id": 1,
                "role": null,
                "collection": "apartments",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 2,
                "role": null,
                "collection": "app_settings_housing_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 3,
                "role": null,
                "collection": "app_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 4,
                "role": null,
                "collection": "buildings_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 5,
                "role": null,
                "collection": "buildings",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 6,
                "role": null,
                "collection": "businesshours",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 7,
                "role": null,
                "collection": "canteens_foodservice_hours",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 8,
                "role": null,
                "collection": "canteens",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 9,
                "role": null,
                "collection": "directus_collections",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 10,
                "role": null,
                "collection": "directus_fields",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 11,
                "role": null,
                "collection": "directus_files",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 12,
                "role": null,
                "collection": "directus_folders",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 13,
                "role": null,
                "collection": "directus_permissions",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 14,
                "role": null,
                "collection": "directus_relations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 15,
                "role": null,
                "collection": "directus_roles",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 16,
                "role": null,
                "collection": "directus_settings",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 17,
                "role": null,
                "collection": "directus_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 18,
                "role": null,
                "collection": "foods_markings",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 19,
                "role": null,
                "collection": "foods",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 20,
                "role": null,
                "collection": "languages",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 21,
                "role": null,
                "collection": "markings",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 22,
                "role": null,
                "collection": "news_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 23,
                "role": null,
                "collection": "news",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 24,
                "role": null,
                "collection": "popup_events_canteens",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 25,
                "role": null,
                "collection": "popup_events_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 26,
                "role": null,
                "collection": "popup_events",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 27,
                "role": null,
                "collection": "utilizations_entries",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 28,
                "role": null,
                "collection": "utilizations_groups",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 29,
                "role": null,
                "collection": "washingmachines",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 30,
                "role": null,
                "collection": "wikis_directus_roles",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 31,
                "role": null,
                "collection": "wikis_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 32,
                "role": null,
                "collection": "wikis",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 34,
                "role": null,
                "collection": "app_translations_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 35,
                "role": null,
                "collection": "buildings_businesshours",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 36,
                "role": null,
                "collection": "collections_dates_last_update",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 37,
                "role": null,
                "collection": "foods_feedbacks_labels_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 38,
                "role": null,
                "collection": "foods_feedbacks_labels",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 39,
                "role": null,
                "collection": "foods_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 40,
                "role": null,
                "collection": "foodsoffers_markings",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            },
            {
                "id": 41,
                "role": null,
                "collection": "markings_translations",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": null,
                "fields": [
                    "*"
                ]
            }
        ]
}

