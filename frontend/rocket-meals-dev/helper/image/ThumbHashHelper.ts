// https://github.com/evanw/thumbhash/blob/main/js/thumbhash.js
// EXAMPLE PAGE TO TEST AND UPLOAD: https://evanw.github.io/thumbhash/
// TODO: Install thumbhash as a package and import it

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
    btoa: (input:string = '')  => {
        let str = input;
        let output = '';

        for (let block = 0, charCode, i = 0, map = chars;
             str.charAt(i | 0) || (map = '=', i % 1);
             output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

            charCode = str.charCodeAt(i += 3/4);

            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }

            block = block << 8 | charCode;
        }

        return output;
    },

    atob: (input:string = '') => {
        let str = input.replace(/=+$/, '');
        let output = '';

        if (str.length % 4 == 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs = 0, buffer, i = 0;
             buffer = str.charAt(i++);

             ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
             bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }

        return output;
    }
};

function myBToa(bytes: Uint8Array) {
    let string = String.fromCharCode(...bytes)
    return Base64.btoa(string)

}

function thumbHashToApproximateAspectRatio(hash: Uint8Array) {
    let header = hash[3]
    let hasAlpha = hash[2] & 0x80
    let isLandscape = hash[4] & 0x80
    let lx = isLandscape ? hasAlpha ? 5 : 7 : header & 7
    let ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7
    return lx / ly
}

function thumbHashToRGBA(hash: Uint8Array) {
    let { PI, min, max, cos, round } = Math

    // Read the constants
    let header24 = hash[0] | (hash[1] << 8) | (hash[2] << 16)
    let header16 = hash[3] | (hash[4] << 8)
    let l_dc = (header24 & 63) / 63
    let p_dc = ((header24 >> 6) & 63) / 31.5 - 1
    let q_dc = ((header24 >> 12) & 63) / 31.5 - 1
    let l_scale = ((header24 >> 18) & 31) / 31
    let hasAlpha = header24 >> 23
    let p_scale = ((header16 >> 3) & 63) / 63
    let q_scale = ((header16 >> 9) & 63) / 63
    let isLandscape = header16 >> 15
    let lx = max(3, isLandscape ? hasAlpha ? 5 : 7 : header16 & 7)
    let ly = max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7)
    let a_dc = hasAlpha ? (hash[5] & 15) / 15 : 1
    let a_scale = (hash[5] >> 4) / 15

    // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
    let ac_start = hasAlpha ? 6 : 5
    let ac_index = 0
    let decodeChannel = (nx: number, ny: number, scale: number) => {
        let ac = []
        for (let cy = 0; cy < ny; cy++)
            for (let cx = cy ? 0 : 1; cx * ny < nx * (ny - cy); cx++)
                ac.push((((hash[ac_start + (ac_index >> 1)] >> ((ac_index++ & 1) << 2)) & 15) / 7.5 - 1) * scale)
        return ac
    }
    let l_ac = decodeChannel(lx, ly, l_scale)
    let p_ac = decodeChannel(3, 3, p_scale * 1.25)
    let q_ac = decodeChannel(3, 3, q_scale * 1.25)
    let a_ac = hasAlpha && decodeChannel(5, 5, a_scale)

    // Decode using the DCT into RGB
    let ratio = thumbHashToApproximateAspectRatio(hash)
    let w = round(ratio > 1 ? 32 : 32 * ratio)
    let h = round(ratio > 1 ? 32 / ratio : 32)
    let rgba = new Uint8Array(w * h * 4), fx = [], fy = []
    for (let y = 0, i = 0; y < h; y++) {
        for (let x = 0; x < w; x++, i += 4) {
            let l = l_dc, p = p_dc, q = q_dc, a = a_dc

            // Precompute the coefficients
            for (let cx = 0, n = max(lx, hasAlpha ? 5 : 3); cx < n; cx++)
                fx[cx] = cos(PI / w * (x + 0.5) * cx)
            for (let cy = 0, n = max(ly, hasAlpha ? 5 : 3); cy < n; cy++)
                fy[cy] = cos(PI / h * (y + 0.5) * cy)

            // Decode L
            for (let cy = 0, j = 0; cy < ly; cy++)
                for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx * ly < lx * (ly - cy); cx++, j++)
                    l += l_ac[j] * fx[cx] * fy2

            // Decode P and Q
            for (let cy = 0, j = 0; cy < 3; cy++) {
                for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx < 3 - cy; cx++, j++) {
                    let f = fx[cx] * fy2
                    p += p_ac[j] * f
                    q += q_ac[j] * f
                }
            }

            // Decode A
            if (hasAlpha)
                for (let cy = 0, j = 0; cy < 5; cy++)
                    for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx < 5 - cy; cx++, j++)
                    { // @ts-ignore
                        a += a_ac[j] * fx[cx] * fy2
                    }

            // Convert to RGB
            let b = l - 2 / 3 * p
            let r = (3 * l - b + q) / 2
            let g = r - q
            rgba[i] = max(0, 255 * min(1, r))
            rgba[i + 1] = max(0, 255 * min(1, g))
            rgba[i + 2] = max(0, 255 * min(1, b))
            rgba[i + 3] = max(0, 255 * min(1, a))
        }
    }
    return { w, h, rgba }
}

function rgbaToDataURL(w: number, h: number, rgba: Uint8Array) {
    let row = w * 4 + 1
    let idat = 6 + h * (5 + row)
    let bytes = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0,
        w >> 8, w & 255, 0, 0, h >> 8, h & 255, 8, 6, 0, 0, 0, 0, 0, 0, 0,
        idat >>> 24, (idat >> 16) & 255, (idat >> 8) & 255, idat & 255,
        73, 68, 65, 84, 120, 1
    ]
    let table = [
        0, 498536548, 997073096, 651767980, 1994146192, 1802195444, 1303535960,
        1342533948, -306674912, -267414716, -690576408, -882789492, -1687895376,
        -2032938284, -1609899400, -1111625188
    ]
    let a = 1, b = 0
    for (let y = 0, i = 0, end = row - 1; y < h; y++, end += row - 1) {
        bytes.push(y + 1 < h ? 0 : 1, row & 255, row >> 8, ~row & 255, (row >> 8) ^ 255, 0)
        for (b = (b + a) % 65521; i < end; i++) {
            let u = rgba[i] & 255
            bytes.push(u)
            a = (a + u) % 65521
            b = (b + a) % 65521
        }
    }
    bytes.push(
        b >> 8, b & 255, a >> 8, a & 255, 0, 0, 0, 0,
        0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
    )
    for (let [start, end] of [[12, 29], [37, 41 + idat]]) {
        let c = ~0
        for (let i = start; i < end; i++) {
            c ^= bytes[i]
            c = (c >>> 4) ^ table[c & 15]
            c = (c >>> 4) ^ table[c & 15]
        }
        c = ~c
        bytes[end++] = c >>> 24
        bytes[end++] = (c >> 16) & 255
        bytes[end++] = (c >> 8) & 255
        bytes[end++] = c & 255
    }
    return 'data:image/png;base64,' + myBToa(bytes)
}



function thumbHashStringToUint8Array(hash: string) {
    let removeSpaces = hash.replace(/\s/g, '')
    let splitInPairs = removeSpaces.match(/.{1,2}/g)
    if(!!splitInPairs) {
        let uint8Array = new Uint8Array(splitInPairs.map(x => parseInt(x, 16)))
        return Uint8Array.from(uint8Array)
    }
    return new Uint8Array()
}

function thumbHashToDataURL(hash: Uint8Array) {
    let image = thumbHashToRGBA(hash)
    return rgbaToDataURL(image.w, image.h, image.rgba)
}

export function thumbHashStringToDataURL(hash: string) {
    const thumbHash = "93 18 0A 35 86 37 89 87 80 77 88 8C 79 28 87 78 08 84 85 40 48";

    return thumbHashToDataURL(thumbHashStringToUint8Array(hash))
}