// define beforeHook type
export interface BeforeHookType {
	(storageKey: string, state: any, payload: any): boolean;
}

// define afterHook type
export interface AfterHookType {
	(storageKey: string, state: any, payload: any): void;
}

export class SynchedVariableInterface {
    public key: string;
	public defaultValue: string | undefined;
	// is a function that returns true if the action should be cancelled
	public beforeHook: BeforeHookType | undefined;
	// is a function that is called after the action has been executed
	public afterHook: AfterHookType | undefined;

	constructor(key: string, defaultValue?: string, beforeHook?: BeforeHookType, afterHook?: AfterHookType) {
		this.key = key;
		this.defaultValue = defaultValue;
		this.beforeHook = beforeHook;
		this.afterHook = afterHook;
	}

}