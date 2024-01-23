import {
    action,
    Actions,
    createStore,
    EasyPeasyConfig,
    FilterActionTypes,
    StateMapper,
    Store,
    thunk,
    useStoreActions,
    useStoreState
} from "easy-peasy";
import {
    AfterHookType,
    BeforeHookType,
    SynchedVariableInterface
} from "@/helper/sync_state_helper/SynchedVariableInterface";
import {NonPersistentStore, NonPersistentStoreValues} from "@/helper/sync_state_helper/NonPersistentStore";
import {PersistentStore, PersistentStoreValues} from "@/helper/sync_state_helper/PersistentStore";
import {StorageHelper} from "@/helper/storage_helper/StorageHelper";
import {PersistentSecureStore, PersistentSecureStoreValues} from "@/helper/sync_state_helper/PersistentSecureStore";
import {SecureStorageHelper} from "@/helper/storage_helper/SecureStorageHelper";

export type SyncStateKeys = PersistentStoreValues | NonPersistentStoreValues | PersistentSecureStoreValues;

export function useSyncStateRaw(storageKey: SyncStateKeys): [value: any, setValue: (value: any) => {}] {
    const value = useStoreState((state) => {
        // @ts-ignore TODO: fix this for correct type
        return state?.[storageKey]?.value
    });
    const setValue = useStoreActions((actions) => {
        // @ts-ignore TODO: fix this for correct type
        return actions?.[storageKey]?.setValue;
    });
    return [
        value,
        setValue
    ]
}

export function useSyncState<T>(storageKey: SyncStateKeys): [value: T | null, setValue: (value: T | null) => void, rawValue: any] {
  const [jsonStateAsString, setJsonStateAsString] = useSyncStateRaw(storageKey);
  const parsedJSON = JSON.parse(jsonStateAsString || "null");
  const setValue = (dict: T | null) => {
      //console.log("setValue", dict)
      //console.log("JSON.stringify(dict)", JSON.stringify(dict))
      setJsonStateAsString(JSON.stringify(dict))
  }
  return [
    parsedJSON,
    setValue,
    jsonStateAsString
  ]
}

interface Model {
    [key: string]: {
        value: any;
        setValue: any;
        setValueSync: any;
    };
}

export class SyncState {

    private storeRetrieved: boolean = false;
    private initialized: boolean = false;

    private globalSynchedStoreModels: {[key: string] : SynchedVariableInterface} = {};

    constructor() {

    }

    async init(){
        await this.registerSyncStateVariablesNonPersistentStore();
        await this.registerSyncStateVariablesPersistentStore();
        await this.registerSyncStateVariablesPersistentSecure();

        this.initialized = true;
    }

    private async getKeysOfClass(classRef: typeof PersistentStore | typeof NonPersistentStore | typeof PersistentSecureStore ){
        let additionalClassKeys = Object.keys(classRef) as Array<keyof typeof classRef>;
        let additionalKeys: string[] = [];
        for(let key of additionalClassKeys){
            let value: any = classRef[key];
            if (typeof value === 'string') {
                additionalKeys.push(value);
            }
        }

        return additionalKeys;
    }

    private async registerSyncStateVariablesPersistentStore(){
        let additionalKeys: string[] = await this.getKeysOfClass(PersistentStore);

        let beforeHook = async (storageKey: string, state: any, payload: any) => {
            //console.log("beforeHook persistent", storageKey, payload)

            await StorageHelper.setItem(storageKey, payload);
            let value = await StorageHelper.getItem(storageKey);
            if(value !== payload){
                console.error("Error setting item", storageKey, payload, value);
                return true; // cancel action
            }
            return false; // do not cancel action
        }

        for(let i=0; i<additionalKeys.length; i++){
            let key = additionalKeys[i];
            let value = await StorageHelper.getItem(key);
            this.registerSyncState(key, value, beforeHook, undefined, undefined);
        }
    }



    private async registerSyncStateVariablesPersistentSecure(){
        let additionalKeys: string[] = await this.getKeysOfClass(PersistentSecureStore);

        let beforeHook = async (storageKey: string, state: any, payload: any) => {
            //console.log("beforeHook persistent secure", storageKey, payload)

            await SecureStorageHelper.setItem(storageKey, payload);
            let value = await SecureStorageHelper.getItem(storageKey);
            if(value !== payload){
                console.error("Error setting item", storageKey, payload, value);
                return true; // cancel action
            }
            return false; // do not cancel action
        }

        for(let i=0; i<additionalKeys.length; i++){
            let key = additionalKeys[i];
            let value = await SecureStorageHelper.getItem(key);
            this.registerSyncState(key, value, beforeHook, undefined, undefined);
        }
    }

    private async registerSyncStateVariablesNonPersistentStore(){
        let additionalKeys: string[] = await this.getKeysOfClass(NonPersistentStore);

        this.registerSyncStates(additionalKeys);
    }


    private registerSyncState(key: string, defaultValue?: string, beforeHook?: BeforeHookType, afterHook?: AfterHookType, override?: boolean){
        if(this.storeRetrieved){
            return new Error("Register State before getStore()");
        }

        let additionalModel = this.globalSynchedStoreModels[key];
        if(!!additionalModel && !override){
            return new Error("Additional variable for storage already exists for that key: "+key);
        }
        this.globalSynchedStoreModels[key] = new SynchedVariableInterface(key, defaultValue, beforeHook, afterHook);
    }

    private registerSyncStates(listOfKeys: string[] | string, defaultValue?: string, beforeHook?: BeforeHookType, afterHook?: AfterHookType, override?: boolean){
        if (typeof listOfKeys === 'string'){
            listOfKeys = [listOfKeys];
        }

        for(let i=0; i<listOfKeys.length; i++){
            let key = listOfKeys[i];
            this.registerSyncState(key, defaultValue, beforeHook, afterHook, override);
        }
    }

    private async handleAction(actions:  Actions<{}>, storageKey: string, state: StateMapper<FilterActionTypes<{}>>, payload: any, aditionalStoreModel: SynchedVariableInterface){
        let beforeHook = aditionalStoreModel.beforeHook;
        let afterHook = aditionalStoreModel.afterHook;
        let cancel = false;
        if(!!beforeHook){
            cancel = await beforeHook(storageKey, state, payload);
        }
        if(!cancel){
            //console.log("handleAction", storageKey, payload)
            // @ts-ignore
            actions.setValueSync(payload);

            //console.log("state", state)
            // @ts-ignore // TODO fix this for correct type
            state.value = payload;
            if(!!afterHook){
                await afterHook(storageKey, state, payload);
            }
        }
    }

    private handleActionSync(state: StateMapper<FilterActionTypes<{}>>, payload: any){
        // @ts-ignore // TODO fix this for correct type
        state.value = payload;
    }

    getStore(): Store<Model, EasyPeasyConfig<undefined, {}>>{
        if(!this.initialized){
            throw new Error("SyncState call init() before getStore()");
        }

        let model: Model = {};

        let additionalKeys = Object.keys(this.globalSynchedStoreModels);

        //console.log("GetStore");
        for(let i=0; i<additionalKeys.length; i++){
            let key = additionalKeys[i];
            let aditionalStoreModel: SynchedVariableInterface = this.globalSynchedStoreModels[key];
            let storageKey = aditionalStoreModel.key;

            //console.log("storageKey", storageKey)


            model[storageKey] = {
                value: aditionalStoreModel.defaultValue,
                setValueSync: action((state, payload) => {
                    this.handleActionSync(state, payload);
                }),
                setValue: thunk( async (actions, payload) => {
                    //console.log("setValue async", payload)
                    await this.handleAction(actions, storageKey, actions, payload, aditionalStoreModel);
                })
            }
        }

        return createStore(
            model
        );
    }

}