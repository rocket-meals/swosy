import { StringHelper } from 'repo-depkit-common';

// SonarCloud reliability rule (regex ReDoS): both patterns below previously used
// unbounded lazy quantifiers (`.*?`), which SonarCloud flagged as having super-linear
// runtime due to backtracking. Both now use bounded, negated-character-class
// quantifiers instead.
export const PARSE_MARKDOWN_REGEX = /(\*\*.{0,500}?\*\*|\*.{0,500}?\*|\[[^\]]{0,500}\]\([^)]{0,2000}\))/g;

export const extractTextAndLink = (description: string) => {
	// Remove unintended spaces between `]` and `(`
	const cleanedDescription = StringHelper.replaceAllWithOptions({ str: description, find: String.raw`]\s+\(`, replace: '](' });

	const regex = /\[([^\]]{0,500})\]\(([^)]{0,2000})\)/g;
	const match = regex.exec(cleanedDescription);

	if (match) {
		const label = match[1]; // The text inside the square brackets
		const link = match[2]; // The URL inside the parentheses
		const textWithoutLinkAndLabel = cleanedDescription.replace(match[0], '').trim(); // Remove the entire match
		return { text: textWithoutLinkAndLabel, label, link };
	}

	return { text: description, label: '', link: null };
};
