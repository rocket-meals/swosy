import {
    action,
    createStore,
    EasyPeasyConfig,
    FilterActionTypes,
    StateMapper,
    Store,
    useStoreActions,
    useStoreState
} from "easy-peasy";
import {
    AfterHookType,
    BeforeHookType,
    SynchedVariableInterface
} from "@/helper/syncStateHelper/SynchedVariableInterface";

function useSyncStateRaw(storageKey: string): [value: string, setValue: (value: any) => {}] {
    const value = useStoreState((state) => {
      // @ts-ignore
        return state?.[storageKey]?.value
    });
    const setValue = useStoreActions((actions) => {
        // @ts-ignore
        return actions?.[storageKey].setValue;
    });
    return [
        value,
        setValue
    ]
}

export function useSyncJsonState(storageKey: string): [value: any, setValue: (value: any) => {}, rawValue: any] {
  const [jsonStateAsString, setJsonStateAsString] = useSyncStateRaw(storageKey);
  const parsedJSON = JSON.parse(jsonStateAsString || "null");
  const setValue = (dict: any) => setJsonStateAsString(JSON.stringify(dict))
  return [
    parsedJSON,
    setValue,
    jsonStateAsString
  ]
}

export interface Model {
    [key: string]: {
        value: any;
        setValue: any;
    };
}

export class SyncState {

    private storeRetrieved: boolean = false;

    private globalSynchedStoreModels: {[key: string] : SynchedVariableInterface} = {};

    private registerSyncState(key: string, defaultValue?: string, beforeHook?: BeforeHookType, afterHook?: AfterHookType, override: boolean = false){
        if(this.storeRetrieved){
            return new Error("Register State before getStore()");
        }

        let additionalModel = this.globalSynchedStoreModels[key];
        if(!!additionalModel && !override){
            return new Error("Additional variable for storage already exists for that key: "+key);
        }
        this.globalSynchedStoreModels[key] = new SynchedVariableInterface(key, defaultValue, beforeHook, afterHook);
    }

    registerSyncStates(listOfKeys: string[] | string, defaultValue?: string, beforeHook?: BeforeHookType, afterHook?: AfterHookType, override: boolean = false){
        if (typeof listOfKeys === 'string'){
            listOfKeys = [listOfKeys];
        }

        for(let i=0; i<listOfKeys.length; i++){
            let key = listOfKeys[i];
            this.registerSyncState(key, defaultValue, beforeHook, afterHook, override);
        }
    }

    private handleAction(storageKey: string, state: StateMapper<FilterActionTypes<{}>>, payload: any, aditionalStoreModel: SynchedVariableInterface){
        let beforeHook = aditionalStoreModel.beforeHook;
        let afterHook = aditionalStoreModel.afterHook;
        let cancel = false;
        if(!!beforeHook){
            cancel = !beforeHook(storageKey, state, payload);
        }
        if(!cancel){
            // @ts-ignore // TODO fix this for correct type
            state.value = payload;
            if(!!afterHook){
                afterHook(storageKey, state, payload);
            }
        }
    }

    getStore(): Store<Model, EasyPeasyConfig<undefined, {}>>{
        let model: Model = {};

        let additionalKeys = Object.keys(this.globalSynchedStoreModels);

        for(let i=0; i<additionalKeys.length; i++){
            let key = additionalKeys[i];
            let aditionalStoreModel: SynchedVariableInterface = this.globalSynchedStoreModels[key];
            let storageKey = aditionalStoreModel.key;
            model[storageKey] = {
                value: aditionalStoreModel.defaultValue,
                setValue: action((state, payload) => {
                    this.handleAction(storageKey, state, payload, aditionalStoreModel);
                })
            }
        }

        return createStore(
            model
        );
    }

}