export type FormInputBaseProps = {
	id: string;
	onChange: (id: string, value: string, custom_type: string) => void;
	error?: string;
	isDisabled?: boolean;
	custom_type: string;
	prefix?: string | null;
	suffix?: string | null;
};
