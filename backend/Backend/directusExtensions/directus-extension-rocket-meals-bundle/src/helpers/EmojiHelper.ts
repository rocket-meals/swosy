enum EmojiPixelSize {
    SMALL = 32,
    MEDIUM = 72,
    LARGE = 128,
    EXTRA_LARGE = 512
}

enum EmojiFileNames {
    RED_CIRCLE = "emoji_u1f534",
    YELLOW_CIRCLE = "emoji_u1f7e1",
    GREEN_CIRCLE = "emoji_u1f7e2",
    THUMBS_UP = "emoji_u1f44d",
    THUMBS_DOWN = "emoji_u1f44e",
    SPEECH_BUBBLE = "emoji_u1f4ac",
}

export class EmojiHelper {

    public static EmojiPixelSize = EmojiPixelSize;
    public static EmojiFileNames = EmojiFileNames;

    private static getEmojiImageURL(filename: EmojiFileNames, size: EmojiPixelSize): string {
        return "https://raw.githubusercontent.com/rocket-meals/noto-emoji/refs/heads/main/png/"+size+"/"+filename+".png"
    }

    private static getEmojiDivTextSize(size: EmojiPixelSize): string {
        // Map the size to approximate `em` units for text-based scaling
        let emojiSizeEm: number;

        switch (size) {
            case EmojiPixelSize.SMALL:
                emojiSizeEm = 1;
                break;
            case EmojiPixelSize.MEDIUM:
                emojiSizeEm = 1.5;
                break;
            case EmojiPixelSize.LARGE:
                emojiSizeEm = 2;
                break;
            case EmojiPixelSize.EXTRA_LARGE:
                emojiSizeEm = 3.5;
                break;
            default:
                emojiSizeEm = 1;
        }

        return `
            display: inline-block;
            width: ${emojiSizeEm}em;
            height: ${emojiSizeEm}em;
            border-radius: 50%;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        `;
    }

    // Generate the full `div` with inline style for embedding
    public static getEmojiDivHTML(filename: EmojiFileNames, size?: EmojiPixelSize): string {
        size = size || EmojiPixelSize.SMALL;
        const imageUrl = EmojiHelper.getEmojiImageURL(filename, size);
        const style = EmojiHelper.getEmojiDivTextSize(size);

        return `<div style="${style} background-image: url('${imageUrl}');"></div>`;
    }
}
