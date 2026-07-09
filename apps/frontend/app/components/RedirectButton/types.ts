export interface RedirectButtonProps {
	type: 'email' | 'link' | 'location';
	label: string;
	backgroundColor?: string;
	color?: string;
	onClick?: () => void;
}
