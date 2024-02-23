import {Text, View} from "@/components/Themed";

export class MarkdownHelper {

    static removeMarkdownTags(text: string): string {
        let textCopy = text;
        // remove markdown tags from text like **bold** or *italic* or [link](url) or ![image](url) or `code` or >quote or - list or # heading
        // remove bold
        textCopy = textCopy.replace(/\*\*(.*?)\*\*/g, "$1");
        // remove italic
        textCopy = textCopy.replace(/\*(.*?)\*/g, "$1");
        // remove link
        textCopy = textCopy.replace(/\[(.*?)\]\((.*?)\)/g, "$1");
        // remove image
        textCopy = textCopy.replace(/!\[(.*?)\]\((.*?)\)/g, "$1");
        // remove code
        textCopy = textCopy.replace(/`(.*?)`/g, "$1");
        // remove quote
        textCopy = textCopy.replace(/>/g, "");
        // remove list
        textCopy = textCopy.replace(/-/g, "");
        // remove heading
        textCopy = textCopy.replace(/#/g, "");
        return textCopy;

    }

}
