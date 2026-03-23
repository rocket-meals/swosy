export type ReplaceOptions = {
  str: string;
  find: string;
  replace: string;
  flags?: string;
}

export type ReplaceCallbackOptions = {
  str: string;
  find: RegExp;
  replace: (match: string, ...args: any[]) => string;
}

export class StringHelper {
  static EMPTY_SPACE = '\u200b';
  static NONBREAKING_SPACE = '\u00a0';
  static NONBREAKING_HALF_SPACE = '\u202f'; // Half space non-breaking

  // also be able to replace "*" with "WILDCARD_REPLACEMENT"
  static replaceAllWithOptions(options: ReplaceOptions) {
    const { str, find, replace, flags } = options;
    return str.replace(new RegExp(find, flags ?? 'g'), replace);
  }

  // Safe literal string replacement using split/join (no regex interpretation)
  static replaceAllLiteralWithOptions(options: Omit<ReplaceOptions, 'flags'>) {
    const { str, find, replace } = options;
    return str.split(find).join(replace);
  }

  // Regex-based replacement with a callback function for dynamic replacements
  static replaceAllWithCallback(options: ReplaceCallbackOptions): string {
    const { str, find, replace } = options;
    const globalRegex = find.flags.includes('g') ? find : new RegExp(find.source, find.flags + 'g');
    return str.replace(globalRegex, replace);
  }

  static capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
