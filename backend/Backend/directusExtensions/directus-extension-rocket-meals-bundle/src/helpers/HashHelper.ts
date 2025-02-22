// https://docs.directus.io/extensions/hooks.html#available-events
import hash from "object-hash";

export class HashHelper {
    public static hashFromObject(object: any): string {
        return hash(object, {
            algorithm: 'md5',
            excludeValues: false,
            ignoreUnknown: false
        });
    }

}