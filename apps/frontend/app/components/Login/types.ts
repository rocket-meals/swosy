// define handleLogin type
type HandleLoginType = (token: string | undefined, email: string, password: string) => void;

export type FormProps = {
	openSheet: () => void;
	openAttentionSheet: () => void;
	onSuccess: (token: string) => void;
	providers: import('@/redux/actions/Auth/Auth').AuthProvider[];
}

export type SheetProps = {
	closeSheet: () => void;
	handleLogin: HandleLoginType;
	loading: Boolean;
}

export type AttentionSheetProps = {
	closeSheet: () => void;
	handleLogin: () => void;
	isBottomSheetVisible: boolean;
}
