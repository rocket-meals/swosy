import type { RedirectButtonBaseProps } from 'repo-depkit-common-ui';

// Same button as MarkdownRedirectButton in repo-depkit-common-ui, only without the 'tel' type:
// the frontend app renders phone numbers as plain links.
export type RedirectButtonProps = RedirectButtonBaseProps & {
	type: 'email' | 'link' | 'location';
};
