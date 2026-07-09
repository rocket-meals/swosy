import type { FormFieldStatusProps, AffixProps } from 'repo-depkit-common-ui';

export type FormInputBaseProps = FormFieldStatusProps &
	AffixProps & {
		id: string;
		onChange: (id: string, value: string, custom_type: string) => void;
		custom_type: string;
	};
