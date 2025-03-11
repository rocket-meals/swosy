// nanoid is best, but it is not available in nodejs
//import ShortUniqueId from 'short-unique-id'; // is slow
import { v4 as uuidv4 } from 'uuid';
import baseX from 'base-x';

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const base62 = baseX(BASE62_ALPHABET);

// Function to generate UUID and encode it in Base62 to match NanoID output
function uuidBase62(size: number): string {
    let encoded = '';
    while (encoded.length < size) {
        encoded += base62.encode(Buffer.from(uuidv4().replace(/-/g, ''), 'hex'));
    }
    return encoded.slice(0, size); // Ensure exactly 64 chars
}

export class NanoidHelper {
    public static async getNanoid(size: number): Promise<string> {
        // old short-unique-id is slow
        //const uid = new ShortUniqueId({ length: size });
        //return uid.randomUUID(size);

        let id = uuidBase62(size);
        return id;
    }
}