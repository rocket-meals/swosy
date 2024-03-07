import {TL1Parser_Web} from "./TL1Parser_Web.js";

export class TL1Parser_Web_SWOSY {

    static getInstance(){
        return new TL1Parser_Web("https://share.sw-os.de/swosy");
    }

}
