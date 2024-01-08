export interface StorageImplementationInterface{
    init(): Promise<void>;
    get(key: string);
    set(key: string, value: string);
    remove(key: string);
    getAllKeys(): string[];
}
