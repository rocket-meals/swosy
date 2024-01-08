import {ImageBase64UploadHook} from './ImageBase64UploadHook.js';
import {FileDeleteCascadeHook} from './FileDeleteCascadeHook.js';
import {FileUpdateDeleteCascadeHook} from './FileUpdateDeleteCascadeHook.js';

export class DefaultImageHelperHook {
    static async beforeUpdateHook(
        collection_name,
        file_field_name,
        payload,
        input,
        database,
        schema,
        accountability,
        registerFunctions,
        context
    ) {
        console.log('Before Update');
        return payload;
    }

    static registerHookSingleCollection(
        collection_name,
        file_field_name,
        registerFunctions,
        context
    ) {

        let before = DefaultImageHelperHook.beforeUpdateHook;

        let after = ImageBase64UploadHook.registerHook.bind(
            null,
            null,
            null
        );

        FileDeleteCascadeHook.handleHook(
            collection_name,
            file_field_name,
            registerFunctions,
            context
        );
        FileUpdateDeleteCascadeHook.handleHook(
            collection_name,
            file_field_name,
            before,
            after,
            registerFunctions,
            context
        );
    }

    static registerHook(
        collection_names,
        file_field_name,
        registerFunctions,
        context
    ) {
        for (let collection_name of collection_names) {
            DefaultImageHelperHook.registerHookSingleCollection(
                collection_name,
                file_field_name,
                registerFunctions,
                context
            );
        }
    }
}
