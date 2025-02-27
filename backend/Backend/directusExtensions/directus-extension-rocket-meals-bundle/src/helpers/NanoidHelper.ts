import ShortUniqueId from 'short-unique-id';

export class NanoidHelper {
    public static async getNanoid(size: number): Promise<string> {
        const uid = new ShortUniqueId({ length: size });
        return uid.randomUUID(size);
    }
}