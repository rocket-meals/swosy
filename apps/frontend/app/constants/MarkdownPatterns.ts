import { UriScheme } from '@/constants/UriScheme';

type ContentPatterns = {
	email: RegExp;
	link: RegExp;
	image: RegExp;
	heading: RegExp;
};

const LINK_SCHEME_PATTERN = String.raw`(?:https?:\/\/|${UriScheme.GEO}|${UriScheme.MAPS}|${UriScheme.TEL})`;

export const markdownContentPatterns: ContentPatterns = {
	email: new RegExp(String.raw`\[([^\]]+)]\((${UriScheme.MAILTO}[^\)]+)\)`),
	link: new RegExp(String.raw`\[([^\]]+)]\((${LINK_SCHEME_PATTERN}[^\)]+)\)`),
	image: /!\[([^\]]*)]\(([^)]+)\)/,
	heading: /^#{1,6}\s*(.*)$/,
};
